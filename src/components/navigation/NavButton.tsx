import { IconProp } from "@fortawesome/fontawesome-svg-core";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

type NavButtonProps = {
    text: string;
    icon?: IconProp;
    onClick: () => void;
    isRoute: boolean;
    collapsed: boolean;
    level?: 1 | 2;
    testId?: string;
}
const NavButton = ({ text, icon, isRoute, onClick, level, collapsed, testId }: NavButtonProps) => {
    return (
        <li className={`list-group-item rounded py-1 w-100 fs-5 ${isRoute ? "fw-bold bg-primary" : ""} ${level ? (level == 2) ? "fs-6 fw-light" : "fs-6 my-1 " : "fs-6 my-1 "}`}>
            <button className="btn text-white bg-navy w-100 text-start" onClick={onClick} data-testid={testId}>
                {icon &&
                    <FontAwesomeIcon icon={icon} width={20} className="pe-2" />
                }
                {!collapsed && text}
            </button>
        </li>
    )
}

export default NavButton;
