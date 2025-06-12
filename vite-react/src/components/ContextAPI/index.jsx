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
