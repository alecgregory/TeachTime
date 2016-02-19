Date.prototype.yyyy_mm_dd = function() {
  var yyyy = this.getFullYear().toString();
  var mm = (this.getMonth()+1).toString(); // getMonth() is zero-based
  var dd = this.getDate().toString();
  return yyyy + '-' + (mm[1]?mm:"0"+mm[0]) + '-' + (dd[1]?dd:"0"+dd[0]); // padding
};

Date.prototype.day_of_week_full = function() {

  // Get day as number
  var dayNumber = this.getDay();
  // Translate to text
  var dayName;
  switch (dayNumber) {
    case 0:
      dayName = 'Sunday';
      break;
    case 1:
      dayName = 'Monday';
      break;
    case 2:
      dayName = 'Tuesday';
      break;
    case 3:
      dayName = 'Wednesday';
      break;
    case 4:
      dayName = 'Thursday';
      break;
    case 5:
      dayName = 'Friday';
      break;
    case 6:
      dayName = 'Saturday';
      break;
    default:
      break;
  }

  return dayName;
};

Date.prototype.day_of_week_short = function() {

  // Get full date name
  var dayName = this.day_of_week_full();
  // Retun first three characters
  return dayName.substring(0, 3);
};

Date.prototype.day_of_week_two = function() {

  // Get full date name
  var dayName = this.day_of_week_short();
  // Retun first three characters
  return dayName.substring(0, 2);
};

Date.prototype.day_of_week_single = function() {

  // Get full date name
  var dayName = this.day_of_week_short();
  // Retun first three characters
  return dayName.substring(0, 1);
};

Date.prototype.month_full = function() {

  // Get day as number
  var monthNumber = this.getMonth();
  // Translate to text
  var monthName;
  switch (monthNumber) {
    case 0:
      monthName = 'January';
      break;
    case 1:
      monthName = 'February';
      break;
    case 2:
      monthName = 'March';
      break;
    case 3:
      monthName = 'April';
      break;
    case 4:
      monthName = 'May';
      break;
    case 5:
      monthName = 'June';
      break;
    case 6:
      monthName = 'July';
      break;
    case 7:
      monthName = 'August';
      break;
    case 8:
      monthName = 'September';
      break;
    case 9:
      monthName = 'October';
      break;
    case 10:
      monthName = 'November';
      break;
    case 11:
      monthName = 'December';
      break;
    default:
      break;
  }

  return monthName;
};

Date.prototype.month_short = function() {

  // Get full date name
  var monthName = this.month_full();
  // Retun first three characters
  return monthName.substring(0, 3);
};