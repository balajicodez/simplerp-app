import {Navigate} from "react-router-dom";
import {useAuth} from "../../hooks/useAuth";
import {jwtDecode} from "jwt-decode";

export const ProtectedRoute = ({ children }) => {
    const { session } = useAuth();
    const token = localStorage.getItem('token');

    if (!session || !token) {
        // user is not authenticated
        return <Navigate to="/login" />;
    }

    const parsedToken = jwtDecode(token);
    if (!parsedToken || Date.now() >= parsedToken.exp * 1000) {
        return <Navigate to="/login" />;
    }


    return children;
};