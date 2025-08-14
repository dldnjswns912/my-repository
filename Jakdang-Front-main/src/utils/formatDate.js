function formatRelativeTime(createDate, pattern) {
  const utcDate = new Date(createDate);
  const currentDate = new Date();
  const timeDifference = currentDate - utcDate;
  const oneDayMillis = 24 * 60 * 60 * 1000;

  const options = {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: true
  };

  switch (pattern) {
      case 0:
          if (timeDifference < 60000) return '지금';
          else if (timeDifference < 3600000) return Math.floor((timeDifference / 60000) % 60) + '분 전';
          else if (timeDifference < oneDayMillis) return Math.floor(timeDifference / 3600000) + '시간 전';
          else return new Intl.DateTimeFormat(undefined, options).format(utcDate);
      case 1:
          if (timeDifference < 60000) return '지금';
          else if (timeDifference < 3600000) return Math.floor((timeDifference / 60000) % 60) + '분 전';
          else if (timeDifference < oneDayMillis) return Math.floor(timeDifference / 3600000) + '시간 전';
          else if (timeDifference < 30 * oneDayMillis) return Math.floor(timeDifference / oneDayMillis) + '일 전';
          else if (timeDifference < 365 * oneDayMillis) return Math.floor(timeDifference / (30 * oneDayMillis)) + '달 전';
          else return Math.floor(timeDifference / (365 * oneDayMillis)) + '년 전';
      case 2:
          if (currentDate.toDateString() === utcDate.toDateString()) return new Intl.DateTimeFormat(undefined, options).format(utcDate);
          else return new Intl.DateTimeFormat(undefined, options).format(utcDate);
      default:
          throw new Error(`Unsupported pattern: ${pattern}`);
  }
}

function applyTimezoneWithPattern(createDate, pattern) {
  try {
      switch (pattern) {
          case 0:
              return applyTimezone(createDate, "yyyy-MM-dd HH:mm:ss");
          case 1:
              return applyTimezone(createDate, "yyyy.MM.dd EE");
          case 2:
              return applyTimezone(createDate, "yyyy.MM.dd");
          case 3:
              return applyTimezone(createDate, "aaa hh:mm");
          case 4:
              return applyTimezone(createDate, "yyyy년MM월dd일");
          default:
              throw new Error(`Invalid pattern: ${pattern}`);
      }
  } catch (e) {
      return createDate;
  }
}

function applyTimezone(createDate, outputPattern) {
  let instant;
  try {
      instant = new Date(createDate);
      if (isNaN(instant.getTime())) {
          throw new Error("Invalid date format");
      }
  } catch (e) {
      throw new Error(`Invalid date format: ${createDate}`);
  }

  const formattedDate = formatWithPattern(instant, outputPattern);
  return formattedDate;
}

function formatWithPattern(date, pattern) {
  let formattedDate;

  switch (pattern) {
      case "yyyy-MM-dd HH:mm:ss":
          formattedDate = date.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
          });
          break;
      case "yyyy.MM.dd EE":
          formattedDate = date.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              weekday: 'long'
          });
          break;
      case "yyyy.MM.dd":
          formattedDate = date.toLocaleString(undefined, {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
          });
          formattedDate = formattedDate.replace(/\.$/, '');
          break;
      case "aaa hh:mm":
          formattedDate = date.toLocaleString(undefined, {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
          });
          break;
      case "yyyy년MM월dd일":
          formattedDate = date.toLocaleString('ko-KR', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit'
          }).replace(/(\d+)\D (\d+)\D (\d+)\D/, '$1년$2월$3일');
          break;
      default:
          throw new Error(`Invalid output pattern: ${pattern}`);
  }

  return formattedDate;
}


export {
  applyTimezoneWithPattern,
  formatRelativeTime,
}