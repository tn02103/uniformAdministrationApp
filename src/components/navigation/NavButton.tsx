import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import styles from "./navigation.module.css";

type NavButtonProps = {
  text: string;
  icon?: IconProp;
  onClick: () => void;
  isRoute: boolean;
  collapsed: boolean;
  level?: 1 | 2;
  testId?: string;
};
const NavButton = ({
  text,
  icon,
  isRoute,
  onClick,
  level,
  collapsed,
  testId,
}: NavButtonProps) => {
  return (
    <li
      className={`list-group-item rounded w-100 fs-5 mt-1 ${
        isRoute ? "fw-bold bg-primary" : ""
      } ${styles.navLink}`}
    >
      <button
        className="btn text-white w-100 text-start px-2 py-1"
        onClick={onClick}
        data-testid={testId}
      >
        {icon && <FontAwesomeIcon icon={icon} width={20} className="" />}
        {!collapsed && text}
      </button>
    </li>
  );
};

export default NavButton;
