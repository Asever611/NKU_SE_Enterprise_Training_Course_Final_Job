import { useAuth } from "../context/AuthContext"

// 创建一个自定义hook，用于在需要保护的路由中检查用户是否已登录
export function useProtectedRoute() {
    const { user, loading } = useAuth()

    // 如果加载完成且用户未登录，则抛出一个未授权错误
    if (!loading && !user) {
        throw new Error("Unauthorized");
    }

    return user;  // 返回当前用户
}