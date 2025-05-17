import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import customParseFormat from "dayjs/plugin/customParseFormat";
import timezone from "dayjs/plugin/timezone";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.tz.setDefault("Germany/Berlin");

import "dayjs/locale/de";
import "dayjs/locale/en";

export default dayjs;