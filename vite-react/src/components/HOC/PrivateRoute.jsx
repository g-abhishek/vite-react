import { Navigate } from "react-router-dom";

const PrivateRoute = ({ component: Component, redirectTo }) => {
  const user = localStorage.getItem("user");

  if (!user) {
    console.log("object  ");
    return <Navigate to={redirectTo} />;
  }

  return <Component />;
};

export default PrivateRoute;
