import Heading from "./Heading";
import "./index.css";
import Section from "./Section";

const ContextAPI = () => {
  return (
    <>
      <Section level={1}>
        <Heading>Heading</Heading>
        <Heading>Heading</Heading>
        <Heading>Heading</Heading>

        <Section level={2}>
          <Heading>Sub Heading</Heading>
          <Heading>Sub Heading</Heading>
          <Heading>Sub Heading</Heading>

          <Section level={3}>
            <Heading>Sub Heading</Heading>
            <Heading>Sub Heading</Heading>
            <Heading>Sub Heading</Heading>

            <Section level={4}>
              <Heading>Sub Heading</Heading>
              <Heading>Sub Heading</Heading>
              <Heading>Sub Heading</Heading>
            </Section>
          </Section>
        </Section>
      </Section>
    </>
  );
};

export default ContextAPI;

/**
 * 

The Context API is used here to solve prop drilling — passing the heading level down through nested sections without repeating it on every <Heading>.

It’s a way to manage global state without prop drilling.

Flow -
      │
      ▼
ContextProvider wraps app  →  <LevelContext.Provider value={1}>
      │
      ▼
<Section level={1}>  →  <LevelContext.Provider value={1}>




The problem -
Each <Heading> must render the right tag (h1, h2, h3, …) based on how deep it sits inside <Section>:

Without Context, you’d have to pass level manually to every heading:
<Heading level={1}>Heading</Heading>  // easy to get wrong
<Heading level={2}>Sub Heading</Heading>

That’s repetitive and brittle — a wrong level breaks semantics and accessibility.

How Context fixes it ***
Three pieces work together:

1. Create the context (LevelContext.jsx):
  import { createContext } from "react";
  export const LevelContext = createContext(1);

2. Section provides the level to everything inside it:
  const Section = ({ level, children }) => {
    return (
      <div className="section">
        <LevelContext value={level}>{children}</LevelContext>
      </div>
    );
  };

3. Heading reads the level — no level prop needed:
  const Heading = ({ children }) => {
    const level = useContext(LevelContext);
    return <h1>{children}</h1>;
    case 2:
      return <h2>{children}</h2>;
    case 3:
      return <h3>{children}</h3>;
    case 4:
      return <h4>{children}</h4>;
    case 5:
      return <h5>{children}</h5>;
    case 6:
      return <h6>{children}</h6>;
  };



When this pattern fits ***
Context works well when:
  1. Many components need the same value (here: heading level)
  2. That value comes from where something sits in the tree, not from the component itself
  3. You want to avoid threading props through layers that don’t use them
 


This is the same idea as theme, locale, or auth context — a parent sets a value; descendants read it without prop drilling.

Note: In older React you’d write <LevelContext.Provider value={level}>. Your code uses the React 19 style where the context object itself acts as the provider.






 * 
 * 
 * 
 * 
 */