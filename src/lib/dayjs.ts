import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import customParseFormat from "dayjs/plugin/customParseFormat.js";
import timezone from "dayjs/plugin/timezone.js";

dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(timezone);
dayjs.tz.setDefault("Europe/Berlin");

import "dayjs/locale/de.js";
import "dayjs/locale/en.js";

export default dayjs;