import Register from "../_components/Register";
import Login from "../_components/Login";
const LoginPage = () => {
  return (
    <section className="flex-1 justify-between flex items-center ">
      <div className="register flex items-center justify-center flex-1  p-2">
        <Register />
      </div>
      <div className=" flex-1 p-2 flex items-center justify-center">
        <Login />
      </div>
    </section>
  );
};

export default LoginPage;
