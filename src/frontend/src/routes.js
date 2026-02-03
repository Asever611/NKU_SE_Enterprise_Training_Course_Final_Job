import { lazy } from "react";
import { Route, Routes, Navigate } from "react-router-dom";
import { AuthLayout } from "./components/AuthLayout";
import { ProtectedRoute } from "./components/ProtectedRoute";

// 懒加载组件
const LoginForm = lazy(() => import("./components/LoginForm"));
const RegisterForm = lazy(() => import("./components/RegisterForm"));
const AssistantPage = lazy(() => import("./components/AssistantPage"));

export function AppRoutes() { 
    return (
        <Routes>
            {/* 认证相关路由（登录/注册）使用AuthLayout布局 */}
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<LoginForm />} />
                <Route path="/register" element={<RegisterForm />} />
            </Route>

            {/* 受保护路由（需要登录） */}
            <Route element={<ProtectedRoute />}>
                <Route path="/" element={<AssistantPage />} />
                <Route path="/conversation/:conversationId" element={<AssistantPage />} />
            </Route>

            {/* 默认路由重定向到登录页 */}
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}