import { LevelContext } from "./LevelContext";

const Section = ({ level, children }) => {
  return (
    <div className="section">
      <LevelContext value={level}>{children}</LevelContext>
    </div>
  );
};

export default Section;
