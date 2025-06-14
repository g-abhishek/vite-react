import Dashboard from "./Dashboard";
import PrivateRoute from "./PrivateRoute";

const HOC = () => {
  return (
    <>
      <PrivateRoute component={Dashboard} redirectTo={"/"} />
      <br />
      <br />
      <code>
        A Higher-Order Component is a function that takes a component and
        returns an enhanced one. It helps in reusing logic like auth, loading,
        and theming. It’s similar to middleware for components. These days, we
        often prefer hooks for logic reuse, but HOCs are still great for
        UI-level wrappers or layout patterns.
      </code>

      <br />
      <code>✅ Real-World Scenario.</code>
      <code>
        We can use HOC to protect private routes. Instead of adding auth checks
        in each component, we can wrap them with HOC, which redirects thems to
        logic if they are not authenticated
      </code>
    </>
  );
};

export default HOC;
