import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { register, login } from '../services/auth';

function RegisterForm() { 
    // 表单状态管理
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        confirm_password: '', // 改为小写
    });

    // 错误状态管理
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const { login: authLogin } = useAuth();
    const navigate = useNavigate();

    // 处理输入变化
    const handleChange = (e) => { 
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    // 表单验证函数
    const validate = () => { 
        const newErrors = {};

        // 验证用户名，3-20个字符
        if (formData.username.length < 3 || formData.username.length > 20) {
            newErrors.username = 'Username must be between 3 and 20 characters.';
        }

        // 验证邮箱
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // 验证密码，至少8个字符，包含字母和数字
        if (!/^(?=.*[A-Za-z])(?=.*\d).{8,}$/.test(formData.password)) {
            newErrors.password = 'Password must be at least 8 characters and contain letters and numbers';
        }

        // 验证确认密码
        if (formData.password !== formData.confirm_password) {
            newErrors.confirm_password = 'Passwords do not match';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;  // 返回验证结果
    };

    // 处理表单提交
    const handleSubmit = async (e) => { 
        e.preventDefault();

        // 先进行客户端验证
        if (!validate()) {
            return;
        }

        setErrors({});
        setLoading(true);

        try {
            // 调用注册API
            const user = await register(formData);

            // 注册成功后自动登录
            const { access_token } = await login({
                username_or_email: formData.username,
                password: formData.password,
            });

            // 更新认证状态
            authLogin(user, access_token);

            // 跳转到AI助手页面
            navigate('/');
        } catch (err) {
            // 处理API错误，用户名已存在等
            setErrors({ api: err.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <h2>Register</h2>

            {/* 显示API错误 */}
            {errors.api && <div className="error">{errors.api}</div>}

            <div className="form-group"> 
                <label>Username</label>
                <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
                {/* 显示用户名错误 */}
                {errors.username && <span className="error">{errors.username}</span>}
            </div>

            <div className="form-group">
                <label>Email</label>
                <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                />
                {errors.email && <span className="error">{errors.email}</span>}
            </div>

            <div className="form-group"> 
                <label>Password</label>
                <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                />
                {errors.password && <span className="error">{errors.password}</span>}
            </div>

            <div className="form-group"> 
                <label>Confirm Password</label>
                <input
                    type="password"
                    name="confirm_password" // 改为小写
                    value={formData.confirm_password}
                    onChange={handleChange}
                    required
                />
                {errors.confirm_password && <span className="error">{errors.confirm_password}</span>}
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Registering...' : 'Register'}
            </button>

            <p>
                Already have an account? <a href="/login">Login</a>
            </p>
        </form>
    )
}

export default RegisterForm;
