import { DateTime,  } from "luxon"

export type DateTimeToDisplay = (dt: DateTime) => string | number

const hourMinuteSecond: DateTimeToDisplay = (dt) => dt.toLocaleString(DateTime.TIME_24_WITH_SECONDS)
const paddedHourMinute: DateTimeToDisplay = (dt) => dt.toLocaleString(DateTime.TIME_24_SIMPLE)
const year: DateTimeToDisplay = (dt) => dt.year
const isoDate: DateTimeToDisplay = (dt) => dt.toISODate()
const monthDayShort: DateTimeToDisplay = (dt) => `${dt.day} ${dt.monthShort}`
const full: DateTimeToDisplay = (dt) => dt.toLocaleString(DateTime.DATETIME_SHORT_WITH_SECONDS)
const monthYear: DateTimeToDisplay = (dt) => `${dt.monthShort} ${dt.year}`
const empty = () => ""

export const granularities: DateTimeToDisplay[][] = [
//            |------------------------------------------------------------------------------ Specificity of this date -----------------------------------------------------------------------------------------------------|
// Resolution  second              // quarterminute           // minute               // quarterhour,     // hour                // day                    // month                     // year          // decade     // cent
/* second */  [hourMinuteSecond,    hourMinuteSecond,         hourMinuteSecond,       hourMinuteSecond,   full,                  full,                     full,                        full,            isoDate      , year],
/* qrtrmnt */ [hourMinuteSecond,    hourMinuteSecond,         hourMinuteSecond,       paddedHourMinute,   paddedHourMinute,      monthDayShort,            isoDate,                     isoDate,         isoDate      , year],
/* minute */  [(dt) => dt.second,   paddedHourMinute,         paddedHourMinute,       paddedHourMinute,   paddedHourMinute,      monthDayShort,            isoDate,                     isoDate,         isoDate      , year],
/* quarter*/  [(dt) => dt.second,   (dt) => dt.minute,        (dt) => dt.minute,      paddedHourMinute,   paddedHourMinute,      monthDayShort,            isoDate,                     isoDate,         isoDate      , year],
/* hour   */  [empty,               (dt) => dt.minute,        (dt) => dt.minute,      paddedHourMinute,   paddedHourMinute,      monthDayShort,            isoDate,                     isoDate,         isoDate      , year],
/* day    */  [empty,               empty,                    empty,                  paddedHourMinute,   (dt) => dt.hour,       (dt) => dt.day,           monthYear,                   monthYear,       monthYear    , year],
/* month  */  [empty,               empty,                    empty,                  paddedHourMinute,   empty,                 (dt) => dt.day,           (dt) => dt.monthShort,       year,            year         , year],
/* year   */  [empty,               empty,                    empty,                  paddedHourMinute,   empty,                 empty,                    (dt) => dt.month,            year,            year         , year],
/* decade */  [empty,               empty,                    empty,                  paddedHourMinute,   empty,                 empty,                    empty,                       year,            year         , year],
/* cent   */  [empty,               empty,                    empty,                  empty,              empty,                 empty,                    empty,                       year,            year         , year]
]
