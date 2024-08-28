import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
dayjs.extend(utc);
dayjs.extend(customParseFormat);
import "dayjs/locale/de";
import "dayjs/locale/en";

export default dayjs;