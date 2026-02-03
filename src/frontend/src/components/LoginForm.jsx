import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { login, getProfile } from "../services/auth";

function LoginForm() { 
    // 表单数据状态
    const [formData, setFormData] = useState({
        username_or_email: '',
        password: '',
    });
    const [error, setError] = useState('');  // 错误信息
    const [loading, setLoading] = useState(false);  // 加载状态
    const { login: authLogin } = useAuth();  // 获取认证上下文中的登陆函数
    const navigate = useNavigate();  // 路由导航

    // 处理表单字段变化
    const handleChange = (e) => { 
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
    };

    // 处理表单提交
    const handleSubmit = async (e) => { 
        e.preventDefault();
        setError('');  // 清空错误信息
        setLoading(true);  // 开始加载

        try {
            const { access_token } = await login(formData);  //  调用登录API
            const user = await getProfile(access_token);  // 获取用户资料
            authLogin(user, access_token);  // 更新认证状态
            navigate('/');  // 跳转到AI助手页面
        } catch (error) { 
            setError(error.message);
        } finally { 
            setLoading(false);  // 结束加载状态
        }
    };

    return (
        <form onSubmit={handleSubmit}> 
            <h2>Login</h2>
            {error && <div className="error">{error}</div>}

            <div className="form-group"> 
                <label>Username or Email</label>
                <input
                    type="text"
                    name="username_or_email"
                    value={formData.username_or_email}
                    onChange={handleChange}
                    required
                />
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
            </div>

            <button type="submit" disabled={loading}>
                {loading ? 'Loading...' : 'Login'}
            </button>

            <p>
                Don't have an account? <a href="/register">Register</a>
            </p>
        </form>
    );
}

export default LoginForm;