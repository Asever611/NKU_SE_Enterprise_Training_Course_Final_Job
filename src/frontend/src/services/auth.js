// API基础URL，可从环境变量获取
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 注册API函数
export const register = async (userData) => {
    const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),  // 将用户数据转换为JSON
    });

    // 如果响应不成功，则抛出错误
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '注册失败');
    }

    // 返回解析后的JSON数据
    return await response.json();
}

// 登陆API函数
export const login = async (credentials) => { 
    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) { 
        const error = await response.json();
        throw new Error(error.detail || '登录失败');
    }

    return await response.json();
}

// 获取用户资料API函数
export const getProfile = async (token) => {
    const response = await fetch(`${API_URL}/profile`, {
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${token}`,  // 携带JWT令牌
        },
    });

    if (!response.ok) { 
        throw new Error('获取用户信息失败');
    }

    return await response.json();
}