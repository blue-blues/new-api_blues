// Custom English locale to override Semi UI Chinese texts
import { enUS as dateFnsEnUS } from 'date-fns/locale';

const enUS = {
  code: 'en-US',
  dateFnsLocale: dateFnsEnUS,
  currency: 'USD',
  Pagination: {
    pageSize: 'Items per page: ${pageSize}',
    total: 'Total pages: ${total}',
    jumpTo: 'Jump to',
    page: ' page'
  },
  Modal: {
    confirm: 'Confirm',
    cancel: 'Cancel'
  },
  Tabs: {
    more: "More"
  },
  TimePicker: {
    placeholder: {
      time: 'Select time',
      timeRange: 'Select a time range'
    },
    begin: 'Start Time',
    end: 'End Time',
    hour: '',
    minute: '',
    second: '',
    AM: 'AM',
    PM: 'PM'
  },
  DatePicker: {
    placeholder: {
      date: 'Select date',
      dateTime: 'Select date and time',
      dateRange: ['Start date', 'End date'],
      dateTimeRange: ['Start date', 'End date'],
      monthRange: ['Start month', 'End month']
    },
    presets: 'Presets',
    footer: {
      confirm: 'Confirm',
      cancel: 'Cancel'
    },
    selectDate: 'Select Date',
    selectTime: 'Select Time',
    year: 'year',
    month: 'month',
    day: 'day',
    monthText: '${month} ${year}',
    months: {
      1: 'Jan',
      2: 'Feb',
      3: 'Mar',
      4: 'Apr',
      5: 'May',
      6: 'Jun',
      7: 'Jul',
      8: 'Aug',
      9: 'Sep',
      10: 'Oct',
      11: 'Nov',
      12: 'Dec'
    },
    fullMonths: {
      1: 'January',
      2: 'February',
      3: 'March',
      4: 'April',
      5: 'May',
      6: 'June',
      7: 'July',
      8: 'August',
      9: 'September',
      10: 'October',
      11: 'November',
      12: 'December'
    },
    weeks: {
      Mon: 'Mon',
      Tue: 'Tue',
      Wed: 'Wed',
      Thu: 'Thu',
      Fri: 'Fri',
      Sat: 'Sat',
      Sun: 'Sun'
    },
    localeFormatToken: {
      FORMAT_SWITCH_DATE: 'MM/dd/yyyy'
    }
  },
  Popconfirm: {
    confirm: 'Confirm',
    cancel: 'Cancel'
  },
  Navigation: {
    collapseText: 'Collapse sidebar',
    expandText: 'Expand sidebar'
  },
  Table: {
    emptyText: 'No data',
    pageText: 'Show ${currentStart} to ${currentEnd} of ${total} entries',
    descend: 'Click to descend',
    ascend: 'Click to ascend',
    cancelSort: 'Cancel sorting',
    selectAllText: 'Select current page',
    selectInvertText: 'Invert current page',
    selectNoneText: 'Clear all data',
    expandText: 'Expand row',
    collapseText: 'Collapse row',
    filteredText: 'filtered'
  },
  Select: {
    emptyText: 'No data',
    createText: 'Create'
  },
  Cascader: {
    emptyText: 'No data'
  },
  Tree: {
    emptyText: 'No data',
    searchPlaceholder: 'Search'
  },
  List: {
    emptyText: 'No data'
  },
  Calendar: {
    allDay: 'All Day',
    AM: '${time} AM',
    PM: '${time} PM',
    datestring: '',
    remaining: '${remained} more'
  },
  Upload: {
    mainText: 'Click to Upload File or Drag File to here',
    illegalTips: 'This type of file is not supported',
    legalTips: 'Release and start uploading',
    retry: 'Retry',
    replace: 'Replace File',
    clear: 'Clear',
    selectedFiles: 'Selected Files',
    illegalSize: 'Illegal file size',
    fail: 'Upload fail'
  },
  TreeSelect: {
    searchPlaceholder: 'Search'
  },
  Typography: {
    copy: 'Copy',
    copied: 'Copied',
    expand: 'Expand',
    collapse: 'Collapse'
  },
  Transfer: {
    emptyLeft: 'No data',
    emptySearch: 'No search results',
    emptyRight: 'No content, check from left',
    placeholder: 'Search content',
    clear: 'Clear',
    selectAll: 'Select all',
    clearSelectAll: 'Clear all',
    total: 'Total ${total} items',
    selected: 'Selected ${selected} items'
  },
  Form: {
    optional: '(optional)'
  },
  Image: {
    preview: 'Preview',
    loading: 'Loading',
    loadError: 'Failed to load',
    prevTip: 'Previous',
    nextTip: 'Next',
    zoomInTip: 'Zoom in',
    zoomOutTip: 'Zoom out',
    rotateTip: 'Rotate',
    downloadTip: 'Download',
    adaptiveTip: 'Adapt to the page',
    originTip: 'Original size'
  },
  Chat: {
    deleteConfirm: 'Are you sure you want to delete this session?',
    clearContext: 'Context cleared',
    copySuccess: 'Copy successful.',
    stop: 'Stop',
    copy: 'Copy',
    copied: 'Copied',
    dropAreaText: 'Put the file here'
  },
  UserGuide: {
    skip: 'Skip',
    next: 'Next',
    prev: 'Prev',
    finish: 'Finish'
  },
  InputNumber: {},
  JsonViewer: {
    search: 'Search',
    replace: 'Replace',
    replaceAll: 'Replace All'
  },
  VideoPlayer: {
    rateChange: 'Switch rate to ${rate}',
    qualityChange: 'Switch quality to ${quality}',
    routeChange: 'Switch route to ${route}',
    mirror: 'Mirror',
    cancelMirror: 'Cancel mirror',
    loading: 'Loading...',
    stall: 'Loading failed',
    noResource: 'No resource',
    videoError: 'Video load error'
  }
};

export default enUS;