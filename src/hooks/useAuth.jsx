import {createContext, useContext, useMemo} from "react";
import {useNavigate} from "react-router-dom";
import {useLocalStorage} from "./useLocalStorage";

const AuthContext = createContext();

export const AuthProvider = ({children}) => {
    const [session, setSession] = useLocalStorage("session", null);

    const navigate = useNavigate();

    // call this function when you want to authenticate the user
    const login = async (token, session) => {
        setSession(session);
        localStorage.setItem('token', token);
        navigate("/");
    };

    // call this function to sign out logged in user
    const logout = () => {
        setSession(null);
        localStorage.removeItem('token');
        navigate("/login", {replace: true});
    };

    const openLoginPage = () => {
        navigate('/login', {replace: true});
    }

    const value = useMemo(
        () => ({
            session,
            login,
            logout,
            openLoginPage
        }),
        [session]
    );
    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    return useContext(AuthContext);
};
