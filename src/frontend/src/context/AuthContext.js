import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// 创建认证上下文
const AuthContext = createContext();

// 认证提供者组件
export function AuthProvider({ children }) { 
    const [user, setUser] = useState(null);  // 用户状态
    const [loading, setLoading] = useState(true);  // 加载状态
    const navigate = useNavigate();  // 路由导航

    // 初始化时检查本地存储中的用户信息
    useEffect(() => { 
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('token');

        // 如果存在用户信息和令牌，恢复登陆状态
        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);  // 标记加载完成
    }, []);

    // 登录函数
    const login = async (userData, token) => {
        // 存储用户信息和令牌到本地
        localStorage.setItem('user', JSON.stringify(userData));
        localStorage.setItem('token', token);
        setUser(userData);  // 更新用户状态
    }

    // 注销函数
    const logout = () => {
        // 清除本地存储
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        setUser(null);  // 清空用户状态
        navigate('/login');  // 重定向到登录页面
    }

    // 提供上下文值
    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

// 自定义hook， 方便组件访问认证上下文
export const useAuth = () => useContext(AuthContext);