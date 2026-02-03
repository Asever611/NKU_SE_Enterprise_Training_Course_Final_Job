import { useState, useEffect, useRef, use } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getConversations, getConversation, uploadFile, deleteConversation, deleteAllConversations, renameConversation } from "../services/assistant";
import Markdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm'
import { v4 as uuidv4 } from 'uuid';
import { ReactComponent as BulbIcon } from '../icon/bulb.svg';
import { ReactComponent as TimeCircleIcon } from '../icon/time-circle.svg';
import { ReactComponent as NewConversationIcon } from '../icon/new-conversation.svg';
import { ReactComponent as SettingIcon } from '../icon/setting.svg';
import { ReactComponent as DolphinIcon } from '../icon/dolphin.svg';
import { ReactComponent as SendIcon } from '../icon/send.svg';
import { ReactComponent as DownCircleIcon } from '../icon/down-circle.svg';
import { ReactComponent as RightCircleIcon } from '../icon/right-circle.svg';
import { ReactComponent as FileAddIcon } from '../icon/file-add.svg';
import { ReactComponent as WriteIcon } from '../icon/write.svg';
import { ReactComponent as CalculatorIcon } from '../icon/calculator.svg';
import { ReactComponent as CcWriteIcon } from '../icon/cc-write.svg';
import { ReactComponent as InfoCircleIcon } from '../icon/info-circle.svg';
import { ReactComponent as FolderOpenIcon } from '../icon/folder-open.svg';
import { ReactComponent as DeleteIcon } from '../icon/delete.svg';

function AssistantPage() { 
    const { user } = useAuth(); // 从权限上下文获取当前用户
    const navigate = useNavigate(); // 路由导航工具, 用于跳转页面
    const { conversationId } = useParams(); // 获取对话ID, 用于加载特定对话

    // 状态管理
    const [conversations, setConversations] = useState([]); // 对话历史列表
    const [currentConversation, setCurrentConversation] = useState(null); // 当前对话详情
    const [activeTab, setActiveTab] = useState('current'); // 左侧面板当前激活的标签(current/history/new/settings)
    const [file, setFile] = useState(null); // 用户选择的待上传文件
    const [newFilename, setNewFilename] = useState('');
    const [isProcessing, setIsProcessing] = useState(false); // 是否正在处理文件(生成笔记/测验)
    const [processingType, setProcessingType] = useState(''); // 当前处理类型
    const [isChatting, setIsChatting] = useState(false);
    const [progress, setProgress] = useState(0); // 主进度值(0-1)
    const [subProgress, setSubProgress] = useState(0); // 子进度值(0-1)
    const [progressMessage, setProgressMessage] = useState(''); // 主进度提示文本
    const [subProgressMessage, setSubProgressMessage] = useState(''); // 子进度提示文本
    const [generateQuiz, setGenerateQuiz] = useState(false); // 是否生成测验
    const [extraRequirements, setExtraRequirements] = useState(''); // 用户额外的要求
    const [finalNotesPath, setFinalNotesPath] = useState('');
    const [finalQuizPath, setFinalQuizPath] = useState('');
    const [messages, setMessages] = useState([]); // 对话消息列表
    const [newMessage, setNewMessage] = useState(''); // 新消息
    const [error, setError] = useState(''); // 错误信息
    const [ws, setWs] = useState(null); // WebSocket实例
    const [currentAIResponse, setCurrentAIResponse] = useState(''); // 当前AI回复的实时内容
    const [currentProcessResponse, setCurrentProcessResponse] = useState(''); // 当前处理文件实时内容 
    const messagesEndRef = useRef(null); // 用于定位消息列表底部, 实现自动滚动
    

    // 用于获取获取最新状态
    const currentConversationRef = useRef(null);
    useEffect(() => { 
        currentConversationRef.current = currentConversation;
    }, [currentConversation]);
    const processingTypeRef = useRef('');
    useEffect(() => { 
        processingTypeRef.current = processingType;
    }, [processingType]);
    const finalNotesPathRef = useRef('');
    useEffect(() => { 
        finalNotesPathRef.current = finalNotesPath;
    }, [finalNotesPath]);
    const finalQuizPathRef = useRef('');
    useEffect(() => { 
        finalQuizPathRef.current = finalQuizPath;
    }, [finalQuizPath]);
    const isChattingRef = useRef(false);
    useEffect(() => { 
        isChattingRef.current = isChatting;
    }, [isChatting]);

    // 新增状态管理面板宽度
    const [leftPanelWidth, setLeftPanelWidth] = useState(30);
    const [isResizing, setIsResizing] = useState(false);
    const containerRef = useRef(null);

    // 开始拖拽
    const startResizing = () => {
        setIsResizing(true);
    };

    // 拖拽过程中调整宽度
    const resize = (e) => {
        if (!isResizing || !containerRef.current) return;
        
        const containerRect = containerRef.current.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const mouseX = e.clientX - containerRect.left;
        const newWidth = (mouseX / containerWidth) * 100;
        
        // 限制宽度在20%-60%之间
        setLeftPanelWidth(Math.min(Math.max(newWidth, 30), 60));
    };

    // 停止拖拽
    const stopResizing = () => {
        setIsResizing(false);
    };

    // 添加/移除事件监听
    useEffect(() => {
        if (isResizing) {
        window.addEventListener('mousemove', resize);
        window.addEventListener('mouseup', stopResizing);
        } else {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        }

        return () => {
        window.removeEventListener('mousemove', resize);
        window.removeEventListener('mouseup', stopResizing);
        };
    }, [isResizing]);

    // 设置容器引用
    useEffect(() => {
        containerRef.current = document.querySelector('.assistant-container');
    }, []);

    // 组件挂载/依赖变化时加载对话历史
    useEffect(() => {
        console.log('----------------------')
        // 如果用户未登录, 跳转到登录页面
        if (!user) {
            navigate('/login');
            return;
        }

        // 加载对话历史的函数
        const loadConversations = async () => {
            try {
                // 获取用户所有对话历史
                const data = await getConversations();
                setConversations(data);

                // 若URL中有 conversationId, 自动加载对应的对话详情
                if (conversationId) {
                    const conv = data.find(c => c.id === parseInt(conversationId));
                    if (conv) {
                        loadConversation(conv.id);
                    }
                }
            } catch (err) {
                setError('Failed to load conversations');
            }
        };

        loadConversations();
    }, [user, navigate, conversationId]);


    // 确保当currentConversation变化时，消息列表也更新
    useEffect(() => {
        if (currentConversation && currentConversation.messages) {
            setMessages(currentConversation.messages);
        }
    }, [currentConversation]);
    // 加载指定id的对话详情
    const loadConversation = async (id) => { 
        console.log('1. 开始加载对话:'+id);
        try {

            if (id === null) {
                if (ws && ws.readyState === WebSocket.OPEN) {
                    ws.close();
                }
                setCurrentConversation(null);
                setMessages([]);
                return;
            }

            const data = await getConversation(id);
            console.log('2. 获取对话详情:' + data);
            console.log('3. 获取对话详情id:'+data.id);
            setCurrentConversation(data); // 更新当前对话详情
            console.log('4. 获取对话详情完成:' + currentConversation);
            setNewFilename(data.filename);
            setFinalNotesPath(data.notes_path);
            setFinalQuizPath(data.quiz_path);
            setMessages(data.messages || []); // 更新消息列表
            setActiveTab('current'); // 切换到当前对话标签

            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }

            const conversation_id = data.id;
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('未找到认证令牌');
            }

            const socket = new WebSocket(
                `ws://localhost:8000/ws/${conversation_id}?token=${token}`
            );

            // 保存WebSocket实例
            setWs(socket);

            // 连接成功后发送处理请求
            socket.onopen = () => { 
                console.log('loadConversation中WebSocket连接成功');
            };

            // 接收后端发送的实时消息
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case "progress":
                            setProgress(data.value);
                            setProgressMessage(data.message);
                            break;
                        case "sub_progress":
                            setSubProgress(data.value);
                            setSubProgressMessage(data.message);
                            break;
                        case "llm_chunk":
                            // 流式输出：每接收到一个chunk就立即显示
                            if (processingTypeRef.current === 'Q&A') {
                                setCurrentAIResponse(prev => prev + data.value); // 生成的消息回复
                            } else {
                                setCurrentProcessResponse(prev => prev + data.value); // 生成的笔记内容
                            }
                            break;
                        case "persistent_error":
                            setError(data.message);
                            setIsProcessing(false);
                            socket.close();
                            break;
                        case "error":
                            console.log('test  error:'+data.message)
                            setError(data.message);
                            break;
                        case "done":
                            console.log('test  1. 获取到了done')
                            console.log('processingType2:'+processingTypeRef.current)
                            if (processingTypeRef.current === 'Notes') {
                                console.log('test  2. 接收到了Notes的done')
                                setProgress(1.0);
                                setFinalNotesPath(data.value);
                                setProgressMessage(data.message);
                                
                                // 如果需要生成测试题, 则单独再发送一次请求
                                if (generateQuiz) {
                                    setProcessingType('Quiz');
                                    setCurrentProcessResponse('');
                                    socket.send(JSON.stringify({
                                        type: 'process',
                                        query: 'Quiz',
                                        extra_requirements: '',
                                    }));
                                } else {
                                    setIsProcessing(false);
                                    loadConversation(conversation_id);
                                    setCurrentProcessResponse('');
                                    console.log('test  3. 重新加载了当前会话');
                                }
                            } else if (processingTypeRef.current === 'Quiz') {
                                setFinalQuizPath(data.value);
                                setProgressMessage(data.message);
                                setIsProcessing(false);
                                loadConversation(conversation_id);
                                setCurrentProcessResponse('');
                            } else { // Q&A 
                                console.log('chat  4. 获取到了Q&A的done')
                                if (currentAIResponse) {
                                    const aiMessage = {
                                        id: uuidv4(),
                                        role: 'assistant',
                                        content: currentAIResponse,
                                        timestamp: new Date().toISOString()
                                    };
                                    setMessages(prev => [...prev, aiMessage]);
                                    
                                }
                                setCurrentAIResponse('');
                                setIsChatting(false);
                                setIsProcessing(false);
                                console.log('chat  5. 完成回答, 关闭了对话状态'+isChattingRef)
                            }

                            break;
                        case "complete":
                            // 重新加载对话详情以获取最新内容
                            loadConversation(conversation_id);
                            break;
                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                    setError('接收消息时发生错误');
                }
            };

            // WebSocket错误回调
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket连接错误');
                setIsProcessing(false);
            };

            // WebSocket关闭回调
            socket.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                if (isProcessing) {
                    setError('连接意外断开');
                    setIsProcessing(false); // 连接意外断开时关闭流式状态
                }
            };


        } catch (err) {
            console.error('Failed to start processing:', err);
            setError(err.message || 'Failed to load conversation');
            setIsProcessing(false);
        }
    };

    const refreshConversations = async () => {
        try {
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            console.error('Failed to refresh conversations:', err);
            setError('刷新对话列表失败');
        }
    };

    // 处理文件上传
    const handleFileUpload = async () => { 
        if (!file) return;

        try {
            // 上传文件返回新对话id, 加载该对话详情
            const data = await uploadFile(file, newFilename);
            await loadConversation(data.conversation_id);
            setLeftPanelWidth(40);
            console.log('返回值:' + data.conversation_id)
            return data.conversation_id;
        } catch (err) {
            setError('Failed to upload file');
        }
    };

    // 下载文件功能
    const downloadFile = async (filePath, fileName) => {
        try {
            const token = localStorage.getItem('token');
            const response = await fetch(`http://localhost:8000/download/${encodeURIComponent(filePath)}`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            
            if (!response.ok) {
                throw new Error('下载失败');
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (err) {
            setError('文件下载失败: ' + err.message);
        }
    };



    // 开始处理文件
    const startProcessing = async () => { 
        
        setIsProcessing(true);
        setProgress(0);
        setSubProgress(0);
        setProgressMessage('Start processing...');
        setError(''); // 清空之前的错误
        setCurrentAIResponse('');
        setCurrentProcessResponse('');
        setProcessingType('Notes');
        console.log('processingType1:'+processingTypeRef.current);
        setFinalNotesPath('');
        setFinalQuizPath('');

        try {
            const conversation_id = await handleFileUpload();
            console.log('5. 开始处理文件:'+ conversation_id);

            // 建立WebSocket连接进行实时通信
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('未找到认证令牌');
            }

            const socket = new WebSocket(
                `ws://localhost:8000/ws/${conversation_id}?token=${token}`
            );

            // 保存WebSocket实例
            setWs(socket);

            // 连接成功后发送处理请求
            socket.onopen = () => { 
                socket.send(JSON.stringify({
                    type: 'process',
                    query: 'Notes',
                    extra_requirements: extraRequirements,
                }));
            };

            // 接收后端发送的实时消息
            socket.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);

                    switch (data.type) {
                        case "progress":
                            setProgress(data.value);
                            setProgressMessage(data.message);
                            break;
                        case "sub_progress":
                            setSubProgress(data.value);
                            setSubProgressMessage(data.message);
                            break;
                        case "llm_chunk":
                            // 流式输出：每接收到一个chunk就立即显示
                            if (processingTypeRef.current === 'Q&A') {
                                setCurrentAIResponse(prev => prev + data.value); // 生成的消息回复
                            } else {
                                setCurrentProcessResponse(prev => prev + data.value); // 生成的笔记内容
                            }
                            break;
                        case "persistent_error":
                            setError(data.message);
                            setIsProcessing(false);
                            socket.close();
                            break;
                        case "error":
                            console.log('test  error:'+data.message)
                            setError(data.message);
                            break;
                        case "done":
                            console.log('test  1. 获取到了done')
                            refreshConversations();
                            console.log('processingType2:'+processingTypeRef.current)
                            if (processingTypeRef.current === 'Notes') {
                                console.log('test  2. 接收到了Notes的done')
                                setProgress(1.0);
                                setFinalNotesPath(data.value);
                                setProgressMessage(data.message);
                                
                                // 如果需要生成测试题, 则单独再发送一次请求
                                if (generateQuiz) {
                                    setProcessingType('Quiz');
                                    setCurrentProcessResponse('');
                                    socket.send(JSON.stringify({
                                        type: 'process',
                                        query: 'Quiz',
                                        extra_requirements: '',
                                    }));
                                } else {
                                    setIsProcessing(false);
                                    loadConversation(conversation_id);
                                    setCurrentProcessResponse('');
                                    console.log('test  3. 重新加载了当前会话');
                                }
                            } else if (processingTypeRef.current === 'Quiz') {
                                setFinalQuizPath(data.value);
                                setProgressMessage(data.message);
                                setIsProcessing(false);
                                loadConversation(conversation_id);
                                setCurrentProcessResponse('');
                            } else { // Q&A 
                                console.log('chat  4. 获取到了Q&A的done')
                                if (currentAIResponse) {
                                    const aiMessage = {
                                        id: uuidv4(),
                                        role: 'assistant',
                                        content: currentAIResponse,
                                        timestamp: new Date().toISOString()
                                    };
                                    setMessages(prev => [...prev, aiMessage]);
                                    
                                }
                                setCurrentAIResponse('');
                                setIsChatting(false);
                                setIsProcessing(false);
                                console.log('chat  5. 完成回答, 关闭了对话状态'+isChattingRef)
                            }

                            break;
                        case "complete":
                            // 重新加载对话详情以获取最新内容
                            loadConversation(conversation_id);
                            break;
                        default:
                            console.log('Unknown message type:', data.type);
                    }
                } catch (err) {
                    console.error('Error parsing WebSocket message:', err);
                    setError('接收消息时发生错误');
                }
            };

            // WebSocket错误回调
            socket.onerror = (error) => {
                console.error('WebSocket error:', error);
                setError('WebSocket连接错误');
                setIsProcessing(false);
            };

            // WebSocket关闭回调
            socket.onclose = (event) => {
                console.log('WebSocket closed:', event.code, event.reason);
                if (isProcessing) {
                    setError('连接意外断开');
                    setIsProcessing(false); // 连接意外断开时关闭流式状态
                }
            };


        } catch (err) {
            console.error('Failed to start processing:', err);
            setError(err.message || '启动处理失败');
            setIsProcessing(false);
        }
    };

    // 发送消息
    const sendMessage = async () => {
        if (!newMessage.trim() || !currentConversation || !ws) return;
        console.log('chat  1. 开始发送消息');
        // 构建用户消息对象
        const userMessage = {
            id: uuidv4(),
            role: 'user',
            content: newMessage,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMessage]); // 更新消息列表
        setNewMessage(''); // 清空输入框
        setCurrentAIResponse(''); // 清空当前AI回复
        setProcessingType('Q&A');
        setIsChatting(true);

        try {
            ws.send(JSON.stringify({
                type: 'message',
                message: newMessage
            }));
            console.log('chat  3. 发送了消息');
        } catch (err) {
            console.log('chat  2. 发送消息时发生错误')
            setError('Failed to send message');
        }
    };

    // 消息列表变化时, 自动滚动到底部
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentAIResponse]);


    // 组件卸载时关闭WebSocket连接
    useEffect(() => { 
        return () => {
            if (ws && ws.readyState === WebSocket.OPEN) {
                ws.close();
            }
        };
    }, [ws]);

    return (
        <div className="assistant-container">
            {/* 错误信息显示 */}
            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {/* 左侧面板 */}
            <div
                className="left-panel"
                style={{ width: `${leftPanelWidth}%` }}
            >
                {/* 顶部导航标签 */}
                <div className="panel-nav">
                    <button
                        className={activeTab === 'current' ? 'active' : ''}
                        onClick={() => setActiveTab('current')}
                    >
                        <BulbIcon className={`nav-icon ${activeTab === 'current' ? 'active-icon' : ''}`} />
                        <span>当前对话</span>
                    </button>
                    <button
                        className={activeTab === 'history' ? 'active' : ''}
                        onClick={() => setActiveTab('history')}
                    >
                        <TimeCircleIcon className={`nav-icon ${activeTab === 'history' ? 'active-icon' : ''}`} />
                        <span>历史对话</span>
                    </button>
                    <button
                        className={activeTab === 'new' ? 'active' : ''}
                        onClick={() => setActiveTab('new')}
                    >
                        <NewConversationIcon className={`nav-icon ${activeTab === 'new' ? 'active-icon' : ''}`} />
                        <span>新对话</span>
                    </button>
                    <button
                        className={activeTab === 'settings' ? 'active' : ''}
                        onClick={() => setActiveTab('settings')}
                    >
                        <SettingIcon className={`nav-icon ${activeTab === 'settings' ? 'active-icon' : ''}`} />
                        <span>设置</span>
                    </button>
                </div>

                {/* 标签页内容区域(根据activeTab显示不同子组件) */}
                <div className="panel-content">
                    {activeTab === 'current' && (
                        <CurrentConversationView
                            conversation={currentConversation}
                            isProcessing={isProcessing}
                            processingType={processingTypeRef.current}
                            currentProcessResponse={currentProcessResponse}
                            newFilename={newFilename}
                            finalNotesPath={finalNotesPath}
                            finalQuizPath={finalQuizPath}
                            onDownload={downloadFile}
                            setNewConversation={setActiveTab}
                        />
                    )}

                    {activeTab === 'history' && (
                        <HistoryView
                            conversations={conversations}
                            onSelect={loadConversation}
                            setConversations={setConversations}
                        />
                    )}

                    {activeTab === 'new' && (
                        <NewConversationView
                            file={file}
                            setFile={setFile}
                            generateQuiz={generateQuiz}
                            setGenerateQuiz={setGenerateQuiz}
                            newFilename={newFilename}
                            setNewFilename={setNewFilename}
                            extraRequirements={extraRequirements}
                            setExtraRequirements={setExtraRequirements}
                            onUpload={handleFileUpload}
                            onProcess={startProcessing}
                            isProcessing={isProcessing}
                            progress={progress}
                            progressMessage={progressMessage}
                            subProgress={subProgress}
                            subProgressMessage={subProgressMessage}
                        />
                    )}

                    {activeTab === 'settings' && (
                        <SettingsView />
                    )}
                </div>
            </div>

            {/* 可拖拽分隔条 */}
            <div 
                className="resizer" 
                onMouseDown={startResizing}
                style={{
                    left: `${leftPanelWidth}%`,
                    transform: `translateX(3px) translateY(-50%)`,
                    top: '50%',
                    
                }}
            />

            {/* 右侧聊天面板 */}
            <div className="right-panel">
                {/* 对话标题 */}
                {currentConversation && (
                    <div className="conversation-header">
                        
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <DolphinIcon style={{ width: '44px', height: '44px', marginRight: '12px' }} />
                            <h3 className="conversation-title">{currentConversation.filename}</h3>
                        </div>
                    </div>
                )}
                
                {/* 聊天消息列表 */}
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div className="empty-state">
                            {currentConversation ? (
                                <div className="success-generate">
                                   {!isProcessing ? (
                                        <h2>🎉恭喜您 📝笔记生成成功 💬开始与AI助手对话吧!</h2>
                                    ): (
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <div className="spinner">
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                                <div></div>
                                            </div>
                                            <h2 style={{ marginLeft: '12px' }}>正在生成内容，请稍后...</h2>
                                        </div>
                                    )} 
                                </div>
                            ) : (
                                <div className="welcome-content">
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '0px' }}>
                                        <DolphinIcon style={{ width: '48px', height: '48px', marginRight: '12px' }} />
                                        <h2>欢迎使用DeepMuse，{user?.username}</h2>
                                        </div>
                                    <p style={{margin: '0px 0px 12px 0px' }}>请上传文件或选择历史对话以开始对话吧！</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div key={msg.id} className={`message ${msg.role}`}>
                                <div className="message-content">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {msg.content}
                                    </Markdown>
                                </div>
                            </div>
                        ))
                    )}

                    {/* 显示当前AI回复的实时内容  */}
                    {isChatting && (
                        <div className="message assistant">
                            <div className="message-content">
                                {currentAIResponse ? (
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {currentAIResponse}
                                    </Markdown>
                                ) : (
                                    <div class="spinner">
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                        <div></div>
                                    </div>
                                    
                                )}
                            </div>
                        </div>
                        
                    )}
                    
                    
                    <div ref={messagesEndRef} />
                </div>

                {/* 聊天输入框 */}
                <div className="chat-input">
                    <textarea
                        value={newMessage}
                        // 输入框内容改变时更新newMessage状态
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="输入您的问题..."
                        // 处理中或未选择对话时禁用输入框
                        disabled={isProcessing || !currentConversation}
                    />
                    <button
                        onClick={sendMessage}
                        disabled={isProcessing || !newMessage.trim() || !currentConversation}
                        className="send-button"  // 添加class以便单独设置样式
                    >
                        <SendIcon className="send-icon" />
                    </button>
                </div>
            </div>
        </div>
    );
}

// 子组件 - 当前对话试图
function CurrentConversationView({
    conversation,
    isProcessing,
    processingType,
    currentProcessResponse,
    newFilename,
    finalNotesPath,
    finalQuizPath,
    onDownload,
    setNewConversation,
}) { 
    const [expandedSections, setExpandedSections] = useState({
        transcript: true,
        notes: true,
        quiz: true
    });

    const toggleSection = (section) => {
        setExpandedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    const notesEndRef = useRef(null);
    const quizEndRef = useRef(null);

    useEffect(() => {
        // 当处理笔记时滚动笔记区域
        if (processingType === 'Notes' && currentProcessResponse) {
            notesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
        
        // 当处理测试题时滚动测试题区域
        if (processingType === 'Quiz' && currentProcessResponse) {
            quizEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [currentProcessResponse, processingType]);

        if (!conversation) {
        return (
            <div className="empty-state">
                <div className="welcome-content">
                    <button
                        className="welcome-button"
                        onClick={() => setNewConversation('new')}
                    >
                        请上传文件或选择历史对话
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="current-conversation">
            {/* 处理中指示器 */}
            {isProcessing && (
                <div className="processing-indicator">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div className="spinner">
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                            <div></div>
                        </div>
                        <h2 style={{ marginLeft: '12px' }}>正在生成内容，请稍后...</h2>
                    </div>
                </div>
            )}
            
            {/* 文件下载按钮 */}
            {(conversation.notes.length > 0 || conversation.quiz.length > 0) && !isProcessing && (
                <div className="download-section">
                    <h3>下载生成的文件</h3>
                    <div className="download-buttons">
                        {conversation.notes.length > 0 && (
                            <button 
                                onClick={() => onDownload(finalNotesPath, newFilename+'_notes.md')}
                                className="download-btn"
                            >
                                <span>下载笔记</span>
                                
                            </button>
                        )}
                        {conversation.quiz.length > 0 && (
                            <button 
                                onClick={() => onDownload(finalQuizPath, newFilename+'_quiz.md')}
                                className="download-btn"
                            >
                                <span>下载测试题</span>
                                
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* 原文内容 */}
            {conversation.transcript.length > 0 && (
                <div className="section">
                    <button 
                        className="section-title" 
                        onClick={() => toggleSection('transcript')}
                    >
                        原文内容 {expandedSections.transcript ?
                            <DownCircleIcon className="toggle-icon" /> :
                            <RightCircleIcon className="toggle-icon" />}
                    </button>
                    {expandedSections.transcript && (
                        <div className="content-box">
                            <div className="message-content">
                                <Markdown
                                    remarkPlugins={[remarkGfm, remarkMath]}
                                    rehypePlugins={[rehypeKatex]}
                                >
                                    {conversation.transcript}
                                </Markdown>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 生成笔记 */}
            {(conversation.notes.length > 0 ||currentProcessResponse) && (
                <div className="section">
                    <button 
                        className="section-title" 
                        onClick={() => toggleSection('notes')}
                    >
                        生成笔记 {expandedSections.notes ?
                            <DownCircleIcon className="toggle-icon" /> :
                            <RightCircleIcon className="toggle-icon" />}
                    </button>
                    {expandedSections.notes && (
                        <div className="content-box">
                            {/* 显示实时生成的内容 */}
                            {isProcessing && processingType === 'Notes' ?(
                                <div className="message-content">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {currentProcessResponse}
                                    </Markdown>
                                </div>
                            ) : (
                                <div className="message-content">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {conversation.notes}
                                    </Markdown>
                                </div>
                            )}
                            <div ref={notesEndRef} />
                        </div>
                    )}
                </div>
            )}

            {/* 测试题 */}
            {(conversation.quiz.length > 0 ||currentProcessResponse) && (
                <div className="section">
                    {(conversation.quiz.length > 0 || (isProcessing && processingType === 'Quiz')) && (
                        <button 
                            className="section-title" 
                            onClick={() => toggleSection('quiz')}
                        >
                            测试题 {expandedSections.quiz ?
                                <DownCircleIcon className="toggle-icon" /> :
                                <RightCircleIcon className="toggle-icon" />}
                        </button>
                    )}
                    {expandedSections.quiz && (
                        <div className="content-box">
                            {/* 显示实时生成的内容 */}
                            {isProcessing && processingType === 'Quiz' ?(
                                <div className="message-content">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {currentProcessResponse}
                                    </Markdown>
                                </div>
                            ) : (
                                <div className="message-content">
                                    <Markdown
                                        remarkPlugins={[remarkGfm, remarkMath]}
                                        rehypePlugins={[rehypeKatex]}
                                    >
                                        {conversation.quiz}
                                    </Markdown>
                                </div>
                            )}
                        <div ref={quizEndRef} />
                    </div>
                    )}
                </div>
            )}
        </div>
    );
}

// 子组件 - 历史记录视图
function HistoryView({ conversations, onSelect, setConversations, currentConversationId }) { 
    const [editingId, setEditingId] = useState(null);
    const [newName, setNewName] = useState('');
    const [error, setError] = useState('');
    const [showDeleteAllConfirm, setShowDeleteAllConfirm] = useState(false);

    const handleDelete = async (id, e) => {
        e.stopPropagation();
        try {
            await deleteConversation(id);
            // Refresh the conversation list by calling onSelect with null
            const data = await getConversations();
            setConversations(data);

            // 如果删除的是当前正在查看的对话
            if (id === currentConversationId) {
                onSelect(null); // 清空当前对话
            }

            return id
        } catch (err) {
            setError(err.message);
        }
    };

    const handleDeleteAll = async (e) => {
        try {
            await deleteAllConversations();
            const data = await getConversations();
            setConversations(data);
            setShowDeleteAllConfirm(false); // 关闭对话框
        } catch (err) {
            setError(err.message);
            setShowDeleteAllConfirm(false); // 关闭对话框
        }
    };

    const startRename = (conv, e) => {
        e.stopPropagation();
        setEditingId(conv.id);
        setNewName(conv.filename);
    };

    const cancelRename = (e) => {
        e.stopPropagation();
        setEditingId(null);
        setNewName('');
    };

    const confirmRename = async (id, e) => {
        e.stopPropagation();
        try {
            await renameConversation(id, newName);
            setEditingId(null);
            setNewName('');
            // Refresh the conversation list by calling onSelect with null
            const data = await getConversations();
            setConversations(data);
        } catch (err) {
            setError(err.message);
        }
    };


    return (
        <div className="history-view">
            <div className="history-header">
                <h3>历史对话</h3>
                <button 
                    onClick={() => setShowDeleteAllConfirm(true)}
                    className="delete-all-btn"
                    disabled={conversations.length === 0}
                >
                    删除所有
                </button>
            </div>

            {error && (
                <div className="error-banner">
                    <span>{error}</span>
                    <button onClick={() => setError('')}>×</button>
                </div>
            )}

            {showDeleteAllConfirm && (
                <div className="custom-confirm-overlay">
                    <div className="custom-confirm-dialog red-dialog">
                        <div className="confirm-content">
                            <h3>确认删除所有对话</h3>
                            <p>此操作将永久删除所有历史对话记录，且不可恢复！</p>
                        </div>
                        <div className="confirm-actions">
                            <button 
                                className="confirm-btn"
                                onClick={handleDeleteAll}
                            >
                                确认删除
                            </button>
                            <button 
                                className="cancel-btn"
                                onClick={() => setShowDeleteAllConfirm(false)}
                            >
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {conversations.length === 0 ? (
                <p>没有历史对话记录</p>
            ) : (
                <div className="conversation-list">
                    {conversations.map(conv => (
                        <div
                            key={conv.id}
                            className="conversation-item"
                            onClick={() => onSelect(conv.id)}
                        >
                            {editingId === conv.id ? (
                                <div className="rename-section">
                                    <input
                                        type="text"
                                        value={newName}
                                        onChange={(e) => setNewName(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        className="rename-input"
                                    />
                                    <div className="rename-buttons">
                                        <button 
                                            onClick={(e) => confirmRename(conv.id, e)}
                                            className="confirm-rename-btn"
                                        >
                                            确认
                                        </button>
                                        <button 
                                            onClick={cancelRename}
                                            className="cancel-rename-btn"
                                        >
                                            取消
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    <div className="conversation-info">
                                        <div className="filename">{conv.filename}</div>
                                        <div className="date">
                                            {new Date(conv.created_at).toLocaleString()}
                                        </div>
                                    </div>
                                    <div className="conversation-actions">
                                        <button 
                                            onClick={(e) => startRename(conv, e)}
                                            className="rename-btn"
                                            style={{ 
                                                padding: '10px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <WriteIcon 
                                                style={{ 
                                                    width: '16px', 
                                                    height: '16px',
                                                    fill: '#6366f1'  // 使用项目主色调紫色
                                                }} 
                                            />
                                        </button>
                                        <button 
                                            onClick={(e) => handleDelete(conv.id, e)}
                                            className="delete-btn"
                                            style={{ 
                                                padding: '10px 16px',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            <DeleteIcon 
                                                style={{ 
                                                    width: '16px', 
                                                    height: '16px',
                                                    fill: '#ef4444'  // 使用红色表示删除操作
                                                }} 
                                            />
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

// 子组件 - 新对话试图
function NewConversationView({
    file, setFile, generateQuiz, setGenerateQuiz,
    newFilename, setNewFilename,
    extraRequirements, setExtraRequirements,
    onUpload, onProcess, isProcessing,
    progress, progressMessage,
    subProgress, subProgressMessage
}) {
    return (
        <div className="new-conversation">
            <h3>开始新对话</h3>

            <div style={{
                background: '#f1f5f9',
                borderRadius: '12px',
                padding: '16px',
                marginBottom: '16px',
                border: '1px solid #e5e7eb'
            }}>
                {/* 文件上传表单 */}
                <form onSubmit={onUpload}>
                    <div className="form-group">
                        <div className="form-label-with-icon">
                            <FileAddIcon className="form-label-icon" />
                            <label>上传文件</label>
                        </div>
                        <div className="file-upload-wrapper">
                            <label className="file-upload-button">
                                <FolderOpenIcon className="folder-icon" />
                                <span>{file ? file.name : '选择文件'}</span>
                                <input
                                    type="file"
                                    onChange={(e) => setFile(e.target.files[0])}
                                    disabled={isProcessing}
                                    style={{ display: 'none' }}
                                />
                            </label>
                        </div>
                        <div className="file-types-info">
                            <div className="info-label">
                                <InfoCircleIcon className="info-icon" />
                                <strong>支持的文件类型:</strong>
                            </div>
                            <ul>
                                <li>视频: .mp4, .mov, .mpeg, .webm</li>
                                <li>音频: .mp3, .m4a, .wav, .amr, .mpga</li>
                                <li>文本: .txt, .md, .pdf, .html, .doc, .docx, .xlsx, .csv, .pptx</li>
                            </ul>
                        </div>
                    </div>

                    {/* 分割线 */}
                    <div className="progress-divider" style={{ margin: '12px 0' }}></div>

                    {/* 文件名输入框*/}
                    <div className="form-group"> 
                        <div className="form-label-with-icon">
                            <WriteIcon className="form-label-icon" />
                            <label>对话名</label>
                        </div>
                        <input
                            type="text"
                            value={newFilename}
                            onChange={(e) => setNewFilename(e.target.value)}
                            placeholder="请输入对话名..."
                            required
                            disabled={isProcessing}
                        />
                    </div>

                    {/* 分割线 */}
                    <div className="progress-divider" style={{ margin: '12px 0' }}></div>

                    {/* 处理选项设置 */}
                    <div className="options">
                        <div className="form-group-checkbox">
                            <div className="checkbox-label-with-icon">
                                <CalculatorIcon className="form-label-icon" />
                                <label>生成测试题</label>
                            </div>
                            <input
                                type="checkbox"
                                checked={generateQuiz}
                                onChange={(e) => setGenerateQuiz(e.target.checked)}
                                disabled={isProcessing}
                            />
                        </div>
                        
                        {/* 分割线 */}
                        <div className="progress-divider" style={{ margin: '12px 0' }}></div>

                        <div className="form-group">
                            <div className="form-label-with-icon">
                                <CcWriteIcon className="form-label-icon" />
                                <label>额外要求</label>
                            </div>
                            <textarea
                                value={extraRequirements}
                                onChange={(e) => setExtraRequirements(e.target.value)}
                                placeholder="对生成笔记的额外要求..."
                                disabled={isProcessing}
                            />
                        </div>
                    </div>
                </form>
            </div>
            
            <button
                    onClick={onProcess}
                    disabled={isProcessing || !file || !newFilename}
                >
                    {isProcessing ? '处理中...' : '开始生成'}
            </button>

            {/* 处理进度显示 */}
            {isProcessing && (
                <div className="progress-container-wrapper">
                    <div className="progress-group">
                        <div className="progress-title">主进度</div>
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${progress * 100}%` }}
                                />
                            </div>
                            <p className="progress-info">{progressMessage}</p>
                        </div>
                    </div>
                    
                    <div className="progress-divider"></div>
                    
                    <div className="progress-group">
                        <div className="progress-title">子进度</div>
                        <div className="progress-container">
                            <div className="progress-bar">
                                <div
                                    className="progress-fill"
                                    style={{ width: `${subProgress * 100}%` }}
                                />
                            </div>
                            <p className="progress-info">{subProgressMessage}</p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// 子组件 - 设置视图
function SettingsView() {
    const { user, logout } = useAuth();

    return (
        <div className="settings-view">
            <h3>用户设置</h3>

            <div className="user-info">
                <div className="user-info-card">
                    <div className="user-avatar">
                        {user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="user-details">
                        <div className="user-field">
                            <span className="field-label">用户名</span>
                            <span className="field-value">{user?.username}</span>
                        </div>
                        <div className="user-field">
                            <span className="field-label">邮箱</span>
                            <span className="field-value">{user?.email}</span>
                        </div>
                    </div>
                </div>
            </div>

            <button onClick={logout} className="logout-btn">
                退出登录
            </button>
        </div>
    );
}

export default AssistantPage;