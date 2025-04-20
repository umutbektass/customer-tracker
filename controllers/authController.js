const User = require('../models/User');
const { generateMainToken, generate2FATempToken } = require('../utils/generateToken');
const speakeasy = require('speakeasy');
const qrcode = require('qrcode');
const sendEmail = require('../utils/sendEmail')
const {errorHandler} = require('../middleware/errorMiddleware')



const loginUser = async (req, res, next) => {
    const { username, password } = req.body;

    if (!username || !password) {
        res.status(400);
        return next(new Error('Lütfen kullanıcı adı ve şifre girin.'));
    }

    try {
        const user = await User.findOne({ username }).select(
            '+password +twoFactorEnabled +twoFactorMethod +twoFactorSecret +email +emailVerificationCode +emailVerificationCodeExpires'
        );

        if (user && (await user.matchPassword(password))) {

            if (user.twoFactorEnabled) {

                if (user.twoFactorMethod === 'authenticator' && user.twoFactorSecret) {
                    const tempToken = generate2FATempToken(user._id);
                    return res.status(200).json({
                        success: true,
                        message: 'Şifre doğrulandı. Lütfen Authenticator kodunuzu girin.',
                        requires2FA: true,
                        method: 'authenticator', 
                        userId: user._id,
                        username:user.username,
                        email:user.email,
                        tempToken: tempToken,

                    });
                }
                else if (user.twoFactorMethod === 'email') {
                    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
                    const codeExpires = Date.now() + 10 * 60 * 1000; 

                    user.emailVerificationCode = verificationCode;
                    user.emailVerificationCodeExpires = new Date(codeExpires);
                    await user.save({ validateBeforeSave: false });

                    try {
                        await sendEmail({
                            email: user.email,
                            subject: 'İki Adımlı Doğrulama Kodunuz',
                            message: `Giriş yapmak için doğrulama kodunuz: ${verificationCode}\nBu kod 10 dakika geçerlidir.`
                        });

                        return res.status(200).json({
                            success: true,
                            message: `Şifre doğrulandı. ${user.email} adresine gönderilen doğrulama kodunu girin.`,
                            requires2FA: true,
                            method: 'email', 
                            userId: user._id ,
                            username:user.username,
                            email:user.email,
                        });
                    } catch (emailError) {
                         console.error("Email gönderme hatası login içinde:", emailError);
                        return next(new Error('Doğrulama kodu e-posta adresinize gönderilirken bir sorun oluştu.'));
                    }
                }
                else {
                    console.error(`Kullanıcı ${user.username} için 2FA aktif ama metot/secret eksik/hatalı.`);
                    res.status(500); 
                    return next(new Error('Hesap 2FA ayarlarında bir tutarsızlık var. Lütfen yönetici ile iletişime geçin.'));
                }

            } else {
                const mainToken = generateMainToken(user._id);
                return res.status(200).json({
                    success: true,
                    message: 'Giriş başarılı.',
                    requires2FA: false,
                    token: mainToken,
                    user: { 
                        _id: user._id, 
                        username: user.username,
                        email: user.email,
                        isAdmin: user.isAdmin, 
                        twoFactorEnabled: user.twoFactorEnabled
                    }
                });
            }
        } else {
            res.status(401); // Unauthorized
            return next(new Error('Geçersiz kullanıcı adı veya şifre.'));
        }
    } catch (error) {
        console.error('Login işlemi sırasında hata:', error);
        next(new Error('Giriş işlemi sırasında bir sunucu hatası oluştu.'));
    }
};




const setupTwoFactor = async (req, res, next) => {
    try {
        const user = await User.findById(req.user.id);

        if (!user) {
            res.status(404);
            return  next(new Error('Kullanıcı bulunamadı.'));
        }

        if (user.twoFactorEnabled) {
            res.status(400);
            return  next(new Error('2FA zaten aktif.'));
        }

        const secret = speakeasy.generateSecret({
            name: `MusteriTakip (${user.email})`,
            length: 20
        });

      
        user.twoFactorSecret = secret.base32; 
        await user.save({ validateBeforeSave: false }); 

        // QR Kodu oluştur
        qrcode.toDataURL(secret.otpauth_url, (err, data_url) => {
            if (err) {
                console.error('QR Kod oluşturma hatası:', err);
                res.status(500);
                return  next(new Error('QR Kodu oluşturulamadı.'));
            }

            res.status(200).json({
                success: true,
                message: 'Authenticator uygulamanızla QR kodunu tarayın ve aldığınız kodu doğrulayın.',
                qrCodeUrl: data_url,
            });
        });

    } catch (error) {
        console.error('2FA Kurulum hatası:', error);
        res.status(400);
        return  next(new Error('2FA kurulumu sırasında bir hata oluştu.'));
    }
};


const verifyAndEnableTwoFactor = async (req, res, next) => {
    const { token: userToken } = req.body;

    if (!userToken) {
        res.status(400);
        return next(new Error('Lütfen Authenticator kodunu girin.'));
    }

    try {
        const user = await User.findById(req.user.id).select('+twoFactorSecret');

        if (!user) {
            res.status(404); // Not Found
            return next(new Error('Kullanıcı bulunamadı.'));
        }

        if (!user.twoFactorSecret) {
            res.status(400); // Bad Request
            return next(new Error('2FA kurulumu başlatılmamış veya secret bulunamadı.'));
        }

        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32', 
            token: userToken,
            window: 1
        });

        if (verified) {
            user.twoFactorEnabled = true;
            user.twoFactorMethod = 'authenticator';
            await user.save();

            res.status(200).json({
                success: true,
                message: '2FA başarıyla etkinleştirildi.'
            });
        } else {
            res.status(400); // Bad Request (veya 401 Unauthorized da olabilir)
            return next(new Error('Geçersiz Authenticator kodu.'));
        }
    } catch (error) {
        console.error('2FA Doğrulama/Etkinleştirme hatası:', error);
        next(new Error('2FA doğrulaması sırasında bir hata oluştu.'));
    }
};




const verifyTwoFactorLogin = async (req, res, next) => {
    const { method, token: userToken, userId, tempToken } = req.body;
    if (!method || !userToken) {
        res.status(400);
        return next(new Error('Eksik bilgi: Metot ve doğrulama kodu gereklidir.'));
    }

    if (method === 'email' && !userId) {
         res.status(400);
         return next(new Error('Eksik bilgi: E-posta doğrulaması için userId gereklidir.'));
    }
    if (method === 'authenticator' && !tempToken) {
        res.status(400);
        return next(new Error('Eksik bilgi: Authenticator doğrulaması için tempToken gereklidir.'));
    }


    try {
        let user;
        let verified = false;

        if (method === 'email') {
           
            user = await User.findById(userId).select('+emailVerificationCode +emailVerificationCodeExpires +twoFactorMethod');

            if (!user) {
                 res.status(404); // Veya 401
                 return next(new Error('Doğrulama için kullanıcı bulunamadı.'));
            }
            if (!user.twoFactorEnabled || user.twoFactorMethod !== 'email') {
                res.status(401);
                return next(new Error('E-posta 2FA bu kullanıcı için aktif değil veya yanlış metot.'));
            }

            if (user.emailVerificationCode === userToken && user.emailVerificationCodeExpires > new Date()) {
                verified = true;
                user.emailVerificationCode = undefined;
                user.emailVerificationCodeExpires = undefined;
                await user.save({ validateBeforeSave: false });
            } else if (user.emailVerificationCodeExpires <= new Date()) {
                 res.status(401);
                 return next(new Error('Doğrulama kodunun süresi dolmuş.'));
            }

        } else if (method === 'authenticator') {
            let decodedTemp;
            try {
                decodedTemp = jwt.verify(tempToken, process.env.JWT_SECRET);
            } catch (err) {
                res.status(401);
                return next(new Error('Geçersiz veya süresi dolmuş Authenticator doğrulama isteği.'));
            }

            if (!decodedTemp.id || decodedTemp.type !== '2fa_pending') {
                res.status(401);
                return next(new Error('Geçersiz Authenticator doğrulama isteği türü.'));
            }

            user = await User.findById(decodedTemp.id).select('+twoFactorSecret +twoFactorMethod'); // Metodu da alalım

            if (!user) {
                 res.status(404); // veya 401
                 return next(new Error('Doğrulama için kullanıcı bulunamadı.'));
            }
            if (!user.twoFactorEnabled || user.twoFactorMethod !== 'authenticator' || !user.twoFactorSecret) {
                res.status(401);
                return next(new Error('Authenticator 2FA bu kullanıcı için aktif değil veya yapılandırılmamış.'));
            }

            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token: userToken,
                window: 1
            });

        } else {
             res.status(400);
             return next(new Error('Geçersiz 2FA metodu belirtildi.'));
        }

        if (verified && user) {
             const mainToken = generateMainToken(user._id);
             res.status(200).json({
                 success: true,
                 message: 'Giriş başarılı (2FA doğrulandı).',
                 token: mainToken,
                 user: { 
                     _id: user._id,
                     username: user.username,
                     email: user.email,
                     isAdmin: user.isAdmin,
                     twoFactorEnabled: user.twoFactorEnabled,
                     twoFactorMethod: user.twoFactorMethod
                 }
             });
        } else {
             res.status(401);
             return next(new Error('Geçersiz 2FA kodu.'));
        }

    } catch (error) {
         console.error('2FA Login Doğrulama Hatası:', error);
         next(new Error('2FA kodu doğrulanırken bir sunucu hatası oluştu.'));
    }
};


const disableTwoFactor = async (req, res, next) => {
    
    try {
        const user = await User.findById(req.user.id).select('+password +twoFactorSecret'); // Gerekirse şifreyi veya secret'ı da al

        if (!user) {
            res.status(404);
        return  next(new Error('Kullanıcı bulunamadı.'));
        }


        if (!user.twoFactorEnabled) {
            res.status(400);
            return  next(new Error('2FA zaten devre dışı.'));
        }

        user.twoFactorEnabled = false;
        user.twoFactorSecret = undefined; 
        user.twoFactorMethod = null;
        await user.save();

        res.status(200).json({
            success: true,
            message: '2FA başarıyla devre dışı bırakıldı.'
        });

    } catch (error) {
        console.error('2FA Devre Dışı Bırakma Hatası:', error);
        return  next(new Error('2FA devre dışı bırakılırken bir hata oluştu.'));
    }
};



const getMe = async (req, res, next) => {
    if (req.user) {
        res.status(200).json({
            success: true,
            user: {
                 _id: req.user._id,
                 username: req.user.username,
                 email: req.user.email,
                 isAdmin: req.user.isAdmin,
                 twoFactorEnabled: req.user.twoFactorEnabled,
                 createdAt: req.user.createdAt
            }
        });
    } else {
        res.status(401);
        return  next(new Error('Yetkisiz erişim.'));
    }
};



module.exports = {
    loginUser,
    setupTwoFactor,
    verifyAndEnableTwoFactor,
    verifyTwoFactorLogin,
    disableTwoFactor,
    getMe,
};