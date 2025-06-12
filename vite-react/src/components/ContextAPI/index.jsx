import Heading from "./Heading";
import "./index.css";
import Section from "./Section";

const ContextAPI = () => {
  return (
    <>
      <Section>
        <Heading level={1}>Heading</Heading>
        <Heading level={1}>Heading</Heading>
        <Heading level={1}>Heading</Heading>

        <Section>
          <Heading level={2}>Sub Heading</Heading>
          <Heading level={2}>Sub Heading</Heading>
          <Heading level={2}>Sub Heading</Heading>
        </Section>
      </Section>
    </>
  );
};

export default ContextAPI;
