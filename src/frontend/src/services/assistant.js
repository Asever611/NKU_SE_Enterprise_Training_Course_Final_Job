const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';

// 上传文件的异步函数, 接受文件对象作为参数
export const uploadFile = async (file, newFilename) => {
    // 创建FormData对象, 用于传递二进制文件数据
    const formData = new FormData();
    // 将文件对象添加到FormData对象中, 键名为'file', 需与后端接口的参数名一致
    formData.append('file', file);
    formData.append('new_filename', newFilename);

    // 发送POST请求到后端的/upload/接口
    const response = await fetch(`${API_URL}/upload/`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`,  // 携带JWT令牌
        },
        body: formData,
    });

    // 请求失败, 状态码非2xx
    if (!response.ok) {
        const error = await response.json(); // 解析后端返回的错误信息
        throw new Error(error.detail || '上传失败');
    }

    // 请求成功, 解析后端返回的JSON数据(包含conversation_id和filename)
    return await response.json();
};

// 获取用户所有对话历史列表函数
export const getConversations = async () => { 
    // 发送GET请求到后端的/conversations/接口
    const response = await fetch(`${API_URL}/conversations/`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        throw new Error('获取对话历史失败');
    }
 
    // 返回对话历史列表(包含每个对话的id, filename, created_at, notes_path, quiz_path)
    return await response.json();
};

// 获取特定对话详情函数, 接收对话id为参数
export const getConversation = async (id) => { 
    // 发送GET请求到后端的/conversations/{id}接口
    const response = await fetch(`${API_URL}/conversations/${id}`, {
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`  
        }
    });
    
    if (!response.ok) {
        throw new Error('获取对话详情失败');
    }

    // 返回对话详情(id, filename, transcript, notes, quiz, messages)
    return await response.json();
};

// 处理文件函数, 接收对话id, 是否生成 quiz, 额外的要求为参数
export const processFile = async (conversationId, generateQuiz, extraRequirements) => {
    // 发送POST请求到后端的/process接口
    const response = await fetch(`${API_URL}/process`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json', // 指定请求体为JSON格式
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
            conversation_id: conversationId, // 对话id(指定要处理的文件)
            generate_quiz: generateQuiz,
            extra_requirements: extraRequirements
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || '处理文件失败');
    }

    // 返回处理结果(generator, conversation_id)
    return await response.json();
}

// Add these new functions to the assistant service

export const deleteConversation = async (conversationId) => {
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete conversation');
    }

    return await response.json();
};

export const deleteAllConversations = async () => {
    const response = await fetch(`${API_URL}/conversations/`, {
        method: 'DELETE',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
    });
    
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to delete conversations');
    }

    return await response.json();
};

export const renameConversation = async (conversationId, newName) => {
    const formData = new FormData();
    formData.append('new_name', newName)
    console.log('Renaming conversation...');
    const response = await fetch(`${API_URL}/conversations/${conversationId}`, {
        method: 'PATCH',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });
    console.log(response.ok);
    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.detail || 'Failed to rename conversation');
    }

    return await response.json();
};