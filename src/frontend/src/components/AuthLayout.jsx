import { useState, useRef, useEffect } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { StarsBackground } from './StarsBackground';
import sample1 from '../samples/sample1.png';
import sample2 from '../samples/sample2.png';
import sample3 from '../samples/sample3.png';
import sample4 from '../samples/sample4.png';
import sample5 from '../samples/sample5.png';
import sample6 from '../samples/sample6.png';
import { ReactComponent as DolphinIcon } from '../icon/dolphin.svg';

export function AuthLayout() {
    const { user } = useAuth();
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isAnimating, setIsAnimating] = useState(false);
    const dolphinRef = useRef(null);
    const originalPosition = useRef({ x: 0, y: 0 });

    

    useEffect(() => {
        // 保存初始位置
        if (dolphinRef.current) {
            const rect = dolphinRef.current.getBoundingClientRect();
            originalPosition.current = {
                x: rect.left + window.scrollX,
                y: rect.top + window.scrollY
            };
        }
    }, []);

    if (user) {
        return <Navigate to="/profile" replace />;    
    }

    const handleMouseEnter = () => {
        if (isAnimating) return;
        
        setIsAnimating(true);
        
        // 随机生成新位置（限制在屏幕可见范围内）
        const maxX = window.innerWidth - 200; // 减去图标宽度
        const maxY = window.innerHeight - 200; // 减去图标高度
        const newX = Math.random() * maxX;
        const newY = Math.random() * maxY;
        
        setPosition({
            x: newX - originalPosition.current.x,
            y: newY - originalPosition.current.y
        });
    };

    const handleAnimationEnd = () => {
        // 缓慢回到原位
        setPosition({ x: 0, y: 0 });
        setIsAnimating(false);
    };

    return (
        <div className="auth-layout">
            {/* 背景粒子效果 */}
            <StarsBackground />
            
            {/* 主内容容器 */}
            <div className="auth-main-container">
                {/* 左侧内容区域 */}
                <div className="auth-content-left">
                    <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        marginBottom: '20%',
                        position: 'relative'
                    }}>
                        {/* 占位元素，保持空间 */}
                        <div style={{ 
                            width: '200px', 
                            height: '200px', 
                            marginRight: '12px',
                            visibility: 'hidden'
                        }} />
                        
                        {/* 实际的海豚图标 */}
                        <div
                            ref={dolphinRef}
                            style={{
                                position: 'absolute',
                                left: '0',
                                top: '0',
                                transform: `translate(${position.x}px, ${position.y}px)`,
                                transition: isAnimating 
                                    ? 'transform 0.5s ease-out' 
                                    : 'transform 1s ease-in-out',
                                zIndex: 10,
                                width: '200px',
                                height: '200px'
                            }}
                            onMouseEnter={handleMouseEnter}
                            onTransitionEnd={handleAnimationEnd}
                        >
                            <DolphinIcon 
                                style={{ 
                                    width: '100%', 
                                    height: '100%',
                                    cursor: 'pointer'
                                }} 
                            />
                        </div>
                        
                        <div className="auth-header">
                            <h1 className="app-title">DeepMuse</h1>
                            <p className="app-subtitle">
                                一个可以根据上传的文件自动生成笔记和聊天的AI智能学习助手
                            </p>
                        </div>
                    </div>
                    
                    <div className="image-showcase-container">
                        <div className="image-showcase">
                            <img 
                                src={sample1} 
                                alt="示例1" 
                                className="sample-image sample-image-1"
                            />
                            <img 
                                src={sample2} 
                                alt="示例2" 
                                className="sample-image sample-image-2"
                            />
                            <img
                                src={sample3} 
                                alt="示例3" 
                                className="sample-image sample-image-3"
                            />
                            <img
                                src={sample4} 
                                alt="示例4" 
                                className="sample-image sample-image-4"
                            />
                            <img
                                src={sample5} 
                                alt="示例5" 
                                className="sample-image sample-image-5"
                            />
                            <img
                                src={sample6} 
                                alt="示例6" 
                                className="sample-image sample-image-6"
                            />
                        </div>
                    </div>
                </div>
                
                {/* 右侧认证表单区域 */}
                <div className="auth-content-right">
                    <div className="auth-form-container">
                        <Outlet />
                    </div>
                </div>
            </div>
            
            {/* 背景动画元素 */}
            <div className="square">
                <ul>
                    {[...Array(5)].map((_, i) => <li key={i} />)}
                </ul>
            </div>
            <div className="circle">
                <ul>
                    {[...Array(5)].map((_, i) => <li key={i} />)}
                </ul>
            </div>
        </div>
    );
}