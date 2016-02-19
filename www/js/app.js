var TT = {};

TT.pad = function (n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}

TT.setUpDatabase = function () {
  // Open or create database
  return openDatabase('TeachTime', '1.0', 'Main DB', 10 * 1024 * 1024);
}

TT.sqlCreateTimeEntryTable = function (tx) {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS '
      + 'time_entry ('
          + 'id INTEGER PRIMARY KEY, '
          + 'lessons_regular INTEGER, '
          + 'lessons_premium INTEGER, '
          + 'entry_date UNIQUE NOT NULL'
        +');'
  );
}

TT.sqlCreateSettingsTable = function (tx) {
  tx.executeSql(
    'CREATE TABLE IF NOT EXISTS '
      + 'settings ('
        + 'id INTEGER PRIMARY KEY, '
        + 'skip_welcome INTEGER DEFAULT 0, '
        + 'pay_rate_regular REAL DEFAULT 21.22, '
        + 'pay_rate_premium REAL DEFAULT 23.87, '
        + 'lessons_regular INTEGER DEFAULT 4, '
        + 'lessons_premium INTEGER DEFAULT 0, '
        + 'pay_day DEFAULT "Thursday", '
        + 'pay_date_1_range_start INTEGER DEFAULT 8, '
        + 'pay_date_1_range_end INTEGER DEFAULT 14, '
        + 'pay_date_2_range_start INTEGER DEFAULT 22, '
        + 'pay_date_2_range_end INTEGER DEFAULT 28'
      +')',
    [],
    function (tx, r) {
      tx.executeSql(
        'SELECT COUNT ( * ) AS c FROM settings',
        [],
        function (tx, r) {
          if (!r.rows[0].c) {
            tx.executeSql(
              'INSERT INTO settings ( id ) VALUES ( 1 )'
            );
          }
        }
      )
    }
  );
}

TT.initializeApp = function () {
  TT.db = TT.setUpDatabase();
  TT.db.transaction(
    function (tx) {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS '
          + 'settings ('
            + 'id INTEGER PRIMARY KEY, '
            + 'pay_rate_regular REAL DEFAULT 21.22, '
            + 'pay_rate_premium REAL DEFAULT 23.87, '
            + 'pay_rate_admin REAL DEFAULT 18.00, '
            + 'lessons_regular INTEGER DEFAULT 4, '
            + 'lessons_premium INTEGER DEFAULT 0, '
            + 'lessons_admin REAL DEFAULT 0 '
          +')',
        [],        
        function (tx, r) {
          tx.executeSql(
            'CREATE TABLE IF NOT EXISTS '
              + 'time_entry ('
                + 'id INTEGER PRIMARY KEY, '
                + 'lessons_regular REAL, '
                + 'lessons_premium REAL, '
                + 'lessons_admin REAL, '
                + 'entry_date UNIQUE NOT NULL'
              +');',
            [],
            function (tx, r) {
              tx.executeSql(
                'CREATE TABLE IF NOT EXISTS '
                  + 'payroll ('
                    + 'id INTEGER PRIMARY KEY, '
                    + 'year INTEGER, '
                    + 'period_number INTEGER, '
                    + 'period_start_date UNIQUE NOT NULL, '
                    + 'period_end_date UNIQUE NOT NULL, '
                    + 'timesheet_due_date UNIQUE NOT NULL, '
                    + 'pay_date UNIQUE NOT NULL '
                  +')',
                [],
                function (tx, r) {
                  tx.executeSql(
                    'SELECT COUNT ( * ) AS c FROM settings',
                    [],
                    function (tx, r) {
                      if (!r.rows[0].c) {
                        tx.executeSql(
                          'INSERT INTO settings ( id ) VALUES ( 1 )',
                          [],
                          function (tx, r) {
                            TT.populatePayroll(tx);
                          }
                        );
                      }
                      TT.initializeWeek(null, tx);
                      TT.initializeEntryForm();
                      // TT.populatePayroll();
                    }
                  );
                }
              );           
            }
          );      
        }
      );
    },
    function (e) {
      console.log("Failed to initialize tables:" + e.message);
    },
    function (r) {
      console.log("Successfully initialized tables");
    }
  );
}

TT.initializeDatabase = function () {
  // Open database
  TT.db = openDatabase('TeachTime', '1.0', 'Main DB', 10 * 1024 * 1024,
    function (db) {
      console.log("TeachTime DB Open");
    }
  );

  // Create table
  TT.db.transaction(
    function (tx) {
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS '
          + 'time_entry ('
              + 'id INTEGER PRIMARY KEY, '
              + 'lessons_regular INTEGER, '
              + 'lessons_premium INTEGER, '
              + 'entry_date UNIQUE NOT NULL'
            +');'
      );
      tx.executeSql(
        'CREATE TABLE IF NOT EXISTS '
          + 'settings ('
              + 'id INTEGER PRIMARY KEY, '
              + 'skip_welcome INTEGER DEFAULT 0, '
              + 'pay_rate_regular REAL DEFAULT 21.22, '
              + 'pay_rate_premium REAL DEFAULT 23.87, '
              + 'lessons_regular INTEGER DEFAULT 4, '
              + 'lessons_premium INTEGER DEFAULT 0, '
              + 'pay_day DEFAULT "Thursday", '
              + 'pay_date_1_range_start INTEGER DEFAULT 8, '
              + 'pay_date_1_range_end INTEGER DEFAULT 14, '
              + 'pay_date_2_range_start INTEGER DEFAULT 22, '
              + 'pay_date_2_range_end INTEGER DEFAULT 28'
            +');'
      );
    },
    function (e) {
      console.log("Failed to initialize tables:" + e.message);
    },
    function (r) {
      console.log("Successfully initialized tables");
    }
  );
}

TT.dropTableTimeEntry = function () {
  
  // Drop time_entry table
  TT.db.transaction(
    function (tx) {
      tx.executeSql('DROP TABLE time_entry');
    },
    function (e) {
      console.log("Failed To Drop time_entry table");
    },
    function (r) {
      console.log("Successfully dropped time_entry table");
    }
  );
}

TT.dropTableSettings = function () {
  
  // Drop settings table
  TT.db.transaction(
    function (tx) {
      tx.executeSql('DROP TABLE settings');
    },
    function (e) {
      console.log("Failed To Drop settings table");
    },
    function (r) {
      console.log("Successfully dropped settings table");
    }
  );
}

TT.dropTablePayroll = function () {
  
  // Drop settings table
  TT.db.transaction(
    function (tx) {
      tx.executeSql('DROP TABLE payroll');
    },
    function (e) {
      console.log("Failed To Drop payroll table");
    },
    function (r) {
      console.log("Successfully dropped payroll table");
    }
  );
}

TT.addTimeEntry = function (event) {

  // Gather date from form
  var lessons_regular = ($('#lessons_regular').val() ? $('#lessons_regular').val() : 0);
  var lessons_premium = ($('#lessons_premium').val() ? $('#lessons_premium').val() : 0);
  var lessons_admin = ($('#lessons_admin').val() ? $('#lessons_admin').val() : 0);
  var entry_date = $('#entry_date').val();

  // Turn date into date object
  var entry_date_object = new Date(entry_date);

  // Get offset
  var offset = entry_date_object.getTimezoneOffset();

  // Adjust date using offset
  entry_date_object.setTime(entry_date_object.getTime() + 1000 * 60 * offset);

  // Check the date isn't a weekend
  if(entry_date_object.getDay() == 0 || entry_date_object.getDay() == 6) {

    // Log error
    console.log("Cannot add data for weekends: " + entry_date_object.day_of_week_full());
    return false;
  }

  // Add items in transaction
  TT.db.transaction(
    function (tx) {
      var query;      
      if (TT.entryExists) {
        query = 'UPDATE time_entry ' 
          + 'SET lessons_regular = ?, '
          + 'lessons_premium = ?, '
          + 'lessons_admin = ?, '
          + 'entry_date = ? '
          + 'WHERE entry_date = ?';
        var arguments = new Array (
            lessons_regular,
            lessons_premium,
            lessons_admin,
            entry_date,
            entry_date
          );
      } else {
        query = 'INSERT INTO time_entry '
            + '( '
              + 'lessons_regular, '
              + 'lessons_premium, '
              + 'lessons_admin, '
              + 'entry_date '
            + ')'
          + 'VALUES (?, ?, ?, ?)';
        var arguments = new Array (
          lessons_regular,
          lessons_premium,
          lessons_admin,
          entry_date
        );
      }
      tx.executeSql(
        query,
        arguments,              
        function (tx, results) {
          console.log("Successfully inserted values into time_entry table");
          var date_source = entry_date.split('-');
          var entry_date_object = new Date (date_source[0], date_source[1] - 1, date_source[2]);
          TT.initializeWeek(entry_date_object, tx);
        },
        function (tx, e) {
          console.log("Failed To insert values into time_entry table: " + e.message);
        }
      );
    }
  );

  return false;
}

TT.initializeEntryForm = function (refDate) {

  // Set lessons default, this will come from the settings table
  var lessons_regular = 4;
  // Set date default, this will be today
  var dateObject = new Date ();

  if (dateObject.getDay() == 0) {
    dateObject.setTime(dateObject.getTime() - 1000 * 60 * 60 * 24 * 2);
  } else if (dateObject.getDay() == 6) {
    dateObject.setTime(dateObject.getTime() - 1000 * 60 * 60 * 24 * 1);
  }
  // Format date
  var entryDateString = dateObject.yyyy_mm_dd();

  // Set default date
  $("#entry_date").val(entryDateString);

  $(dateObject.day_of_week_short() + ' .day-border').css('border-color', '#2ba6cb');

  // Set up buttons
  $("#addButton").off().on('click', TT.addTimeEntry);
  $("#settingsButton").off().on('click', TT.showSettingsModal);

  $("#mon .entry_value").on('click', null, {day: "#mon"}, TT.takeEntry);
  $("#tue .entry_value").on('click', null, {day: "#tue"}, TT.takeEntry);
  $("#wed .entry_value").on('click', null, {day: "#wed"}, TT.takeEntry);
  $("#thu .entry_value").on('click', null, {day: "#thu"}, TT.takeEntry);
  $("#fri .entry_value").on('click', null, {day: "#fri"}, TT.takeEntry);
}

TT.showSettingsModal = function () {
  TT.initializeSettings();
  $('#settingsModal').foundation('open');
}

TT.initializeSettings = function () {

  // Get settings
  TT.db.transaction(
    function (tx) {
      tx.executeSql(
        'SELECT * FROM settings;',
        [],
        function (tx, results) {
          if (results.rows.length) {
            TT.settingsSkipWelcome = results.rows.item(0).skip_welcome;
            TT.settingsPayRateRegular = results.rows.item(0).pay_rate_regular;
            TT.settingsPayRatePremium = results.rows.item(0).pay_rate_premium;
            TT.settingsPayRateAdmin = results.rows.item(0).pay_rate_admin;
            TT.settingsSkipWelcome == 1 ?
              $('#skip_welcome').prop('checked', true) :
              $('#skip_welcome').prop('checked', false);
            $('#pay_rate_regular').val(TT.settingsPayRateRegular);
            $('#pay_rate_premium').val(TT.settingsPayRatePremium);
            $('#pay_rate_admin').val(TT.settingsPayRateAdmin);
            $("#saveSettings").on('click', TT.saveSettings);
            $("#deleteAllEntries").on('click', TT.dropTableTimeEntry);
            $("#deleteSettings").on('click', TT.dropTableSettings);
            $("#deletePayroll").on('click', TT.dropTablePayroll);
            $("#calculatePay").on('click', TT.calculatePay);
          }
        },
        function (tx, e) {
          console.log("Failed To retrieve values from settings: " + e.message);
        }
      );
    }
  );
}

TT.saveSettings = function () {
  
  var skip_welcome = ($('#skip_welcome').prop("checked") ? 1 : 0);
  var pay_rate_regular = $('#pay_rate_regular').val();
  var pay_rate_premium = $('#pay_rate_premium').val();
  var pay_rate_admin = $('#pay_rate_admin').val();

  console.log("Attempting to update settings");

  // Add items in transaction
  TT.db.transaction(
    function (tx) {
      tx.executeSql(
        'UPDATE settings '
          + 'SET skip_welcome = ?, '
          + 'pay_rate_regular = ?, '
          + 'pay_rate_premium = ?, '
          + 'pay_rate_admin = ? ',
        [
          skip_welcome,
          pay_rate_regular,
          pay_rate_premium,
          pay_rate_admin
        ],              
        function (tx, results) {
          console.log("Successfully updated settings");
          $('#settingsModal').foundation('close');
        },
        function (tx, e) {
          console.log("Failed to update settings: " + e.message);
        }
      );
    }
  );

  return false;
}

TT.buildWeek = function (refDate) {
  // Set week variable
  var week = new Array(5);

  // Get day adjuster
  var adjuster = refDate.getDay() - 1;

  // Get Monday
  var monday = new Date();
  monday.setTime(refDate.getTime() - 1000 * 60 * 60 * 24 * adjuster);

  // Put monday in array
  week[0] = monday;

  // Based on Monday put the rest of the working week in array
  for (var i = 1; i <= 4; i++) {
    var nextDay = new Date();
    nextDay.setTime(monday.getTime() + 1000 * 60 * 60 * 24 * i);
    week[i] = nextDay;
  };

  return week;
}

TT.initializeWeek = function (refDate, tx) {

  if (!refDate) {
    var refDate = new Date();

    if (refDate.getDay() == 0) {
      refDate.setTime(refDate.getTime() - 1000 * 60 * 60 * 24 * 2);
    } else if (refDate.getDay() == 6) {
      refDate.setTime(refDate.getTime() - 1000 * 60 * 60 * 24 * 1);
    }
  }

  // Unselect day
  $('.day-border').css('border-color', '#FFFFFF');

  TT.weekRefDate = refDate;

  $("#year").html(TT.weekRefDate.month_full() + ' ' + TT.weekRefDate.getFullYear());

  var week = TT.buildWeek (refDate);

  TT.thisWeek = week;

  // Get date range
  var dateRangeClause = TT.buildDateRangeClause(week[0], week[4]);

  if (!tx) {
    TT.db.transaction(
      function (tx) {
        tx.executeSql(
          'SELECT * FROM time_entry WHERE entry_date '
            + dateRangeClause
            + ' ORDER BY entry_date',
          [],
          function (tx, results) {
            TT.resultsTimeEntry = results;
            tx.executeSql(
              'SELECT * FROM payroll '
              + 'WHERE timesheet_due_date '
                + dateRangeClause
                + ' ORDER BY timesheet_due_date'
                ,
              [],
              function (tx, results) {
                TT.resultsTimesheetDue = results;
                tx.executeSql(
                  'SELECT * FROM payroll '
                  + 'WHERE pay_date '
                    + dateRangeClause
                    + ' ORDER BY pay_date'
                    ,
                  [],
                  function (tx, results) {
                    TT.resultsPayDate = results;
                    TT.createWeekEntries(week, TT.resultsTimeEntry, TT.resultsTimesheetDue, TT.resultsPayDate);
                  }
                );
              }
            );
            return false;
          },
          function (tx, e) {
            console.log("Failed To retrieve values from time_entry table: " + e.message);
          }
        );
      }
    );
  } else {
    tx.executeSql(
      'SELECT * FROM time_entry WHERE entry_date '
        + dateRangeClause
        + ' ORDER BY entry_date',
      [],
      function (tx, results) {
        TT.resultsTimeEntry = results;
        tx.executeSql(
          'SELECT * FROM payroll '
          + 'WHERE timesheet_due_date '
            + dateRangeClause
            + ' ORDER BY timesheet_due_date'
            ,
          [],
          function (tx, results) {
            TT.resultsTimesheetDue = results;
            tx.executeSql(
              'SELECT * FROM payroll '
              + 'WHERE pay_date '
                + dateRangeClause
                + ' ORDER BY pay_date'
                ,
              [],
              function (tx, results) {
                TT.resultsPayDate = results;
                TT.createWeekEntries(week, TT.resultsTimeEntry, TT.resultsTimesheetDue, TT.resultsPayDate);
              }
            );

          }
        );
        return false;
      },
      function (tx, e) {
        console.log("Failed To retrieve values from time_entry table: " + e.message);
      }
    );
  }
}

TT.createWeekEntries = function (week, weekTimeEntries, weekTimesheetDue, weekPayDate) {

  var weekHtml = new Array(5);

  TT.payDayName = null;

  for (var i = 0; i < 5; i++) {    

    weekHtml[i] = {
      label: week[i].day_of_week_two()
        + ' '
        + week[i].getDate(),
      entry: '',
      dayType: ''
    };

    // Iterate through timesheet due dates looking for match
    for (var j = weekTimesheetDue.rows.length - 1; j >= 0; j--) {
      if (week[i].yyyy_mm_dd() == weekTimesheetDue.rows[j].timesheet_due_date) {
        weekHtml[i].dayType = 'TS';
      }
    };

    // Iterate through time entries looking for match
    for (var j = weekPayDate.rows.length - 1; j >= 0; j--) {
      if (week[i].yyyy_mm_dd() == weekPayDate.rows[j].pay_date) {
        weekHtml[i].dayType = '<a>$</a>';
        TT.payDayName = week[i].day_of_week_short().toLowerCase();
        TT.payDate = week[i].yyyy_mm_dd();
      }
    };

    // Iterate through time entries looking for match
    for (var j = weekTimeEntries.rows.length - 1; j >= 0; j--) {
      if (week[i].yyyy_mm_dd() == weekTimeEntries.rows[j].entry_date) {
        weekHtml[i].entry = weekTimeEntries.rows[j].lessons_regular
          + '/'
          + weekTimeEntries.rows[j].lessons_premium
          + '/'
          + weekTimeEntries.rows[j].lessons_admin;
      }
    };
  }

  $("#mon .day-label").html(weekHtml[0].label);
  (weekHtml[0].dayType ? $("#mon .day-type").html(weekHtml[0].dayType) : $("#mon .day-type").html(String.fromCharCode(160)));
  (weekHtml[0].entry ? $("#mon .entry_value").html(weekHtml[0].entry) : $("#mon .entry_value").html('+'));
  $("#tue .day-label").html(weekHtml[1].label);
  (weekHtml[1].dayType ? $("#tue .day-type").html(weekHtml[1].dayType) : $("#tue .day-type").html(String.fromCharCode(160)));
  (weekHtml[1].entry ? $("#tue .entry_value").html(weekHtml[1].entry) : $("#tue .entry_value").html('+'));
  $("#wed .day-label").html(weekHtml[2].label);
  (weekHtml[2].dayType ? $("#wed .day-type").html(weekHtml[2].dayType) : $("#wed .day-type").html(String.fromCharCode(160)));
  (weekHtml[2].entry ? $("#wed .entry_value").html(weekHtml[2].entry) : $("#wed .entry_value").html('+'));
  $("#thu .day-label").html(weekHtml[3].label);
  (weekHtml[3].dayType ? $("#thu .day-type").html(weekHtml[3].dayType) : $("#thu .day-type").html(String.fromCharCode(160)));
  (weekHtml[3].entry ? $("#thu .entry_value").html(weekHtml[3].entry) : $("#thu .entry_value").html('+'));
  $("#fri .day-label").html(weekHtml[4].label);
  (weekHtml[4].dayType ? $("#fri .day-type").html(weekHtml[4].dayType) : $("#fri .day-type").html(String.fromCharCode(160)));
  (weekHtml[4].entry ? $("#fri .entry_value").html(weekHtml[4].entry) : $("#fri .entry_value").html('+'));
  $("#previousWeek").off().on('click', TT.previousWeek);
  $("#nextWeek").off().on('click', TT.nextWeek);
  $("#mon .entry_value").off().on('click', null, {day: "#mon"}, TT.takeEntry);
  $("#tue .entry_value").off().on('click', null, {day: "#tue"}, TT.takeEntry);
  $("#wed .entry_value").off().on('click', null, {day: "#wed"}, TT.takeEntry);
  $("#thu .entry_value").off().on('click', null, {day: "#thu"}, TT.takeEntry);
  $("#fri .entry_value").off().on('click', null, {day: "#fri"}, TT.takeEntry);

  $("#" + TT.payDayName + " .day-type").off().on('click', null, {payDate: TT.payDate}, TT.calculatePay);

  $('.day-type').removeClass('pay-amount');

  return;
}

TT.buildDateRangeClause = function (fromDate, toDate) {
  
  // Simple version requires both dates
  if (!fromDate || !toDate) {
    return;
  }

  // Create range query string
  var rangeClause = 'BETWEEN '
    + "'"
    + fromDate.yyyy_mm_dd()
    + "'"
    + ' AND '
    + "'"
    + toDate.yyyy_mm_dd()
    + "'";

  return rangeClause;
}

TT.previousWeek = function () {
  // Initialize previous week
  TT.initializeWeek(new Date(TT.weekRefDate.getTime() - 1000 * 60 * 60 * 24 * 7));
  $("#entry_date").val(TT.weekRefDate.yyyy_mm_dd());
}

TT.nextWeek = function () {
  // Initialize next week
  TT.initializeWeek(new Date(TT.weekRefDate.getTime() + 1000 * 60 * 60 * 24 * 7));
  $("#entry_date").val(TT.weekRefDate.yyyy_mm_dd());
}

TT.takeEntry = function (event) {
  // Add border to selected day
  $('.day-border').css('border-color', '#FFFFFF');
  $(event.data.day + ' .day-border').css('border-color', '#2ba6cb');

  // Populate form
  if ($(event.data.day + ' .entry .entry_value').html().indexOf('/') > -1) {
    var valueRegular = $(event.data.day + ' .entry .entry_value').html().split('/')[0];
    var valuePremium = $(event.data.day + ' .entry .entry_value').html().split('/')[1];
    var valueAdmin = $(event.data.day + ' .entry .entry_value').html().split('/')[2];
    valueRegular = valueRegular > 0 ? valueRegular : '';
    valuePremium = valuePremium > 0 ? valuePremium : '';
    valueAdmin = valueAdmin > 0 ? valueAdmin : '';
    $("#lessons_regular").val(valueRegular);
    $("#lessons_premium").val(valuePremium);
    $("#lessons_admin").val(valueAdmin);
    TT.entryExists = true;
  } else {
    $("#lessons_regular").val('');
    $("#lessons_premium").val('');
    $("#lessons_admin").val('');
    TT.entryExists = false;
  }
  if (event.data.day == "#mon") {
    $("#entry_date").val(TT.thisWeek[0].yyyy_mm_dd());
    TT.weekRefDate.setTime(TT.thisWeek[0].getTime());
  } else if (event.data.day == "#tue") {
    $("#entry_date").val(TT.thisWeek[1].yyyy_mm_dd());
    TT.weekRefDate.setTime(TT.thisWeek[1].getTime());
  } else if (event.data.day == "#wed") {
    $("#entry_date").val(TT.thisWeek[2].yyyy_mm_dd());
    TT.weekRefDate.setTime(TT.thisWeek[2].getTime());
  } else if (event.data.day == "#thu") {
    $("#entry_date").val(TT.thisWeek[3].yyyy_mm_dd());
    TT.weekRefDate.setTime(TT.thisWeek[3].getTime());
  } else if (event.data.day == "#fri") {
    $("#entry_date").val(TT.thisWeek[4].yyyy_mm_dd());
    TT.weekRefDate.setTime(TT.thisWeek[4].getTime());
  }
}

TT.populatePayroll = function (tx) {
  var payrollPeriods = [
    [2016,1,'2015-12-21','2016-01-01','2015-12-28','2015-12-31'],
    [2016,2,'2016-01-04','2016-01-15','2016-01-11','2016-01-14'],
    [2016,3,'2016-01-18','2016-01-29','2016-01-25','2016-01-28'],
    [2016,4,'2016-02-01','2016-02-12','2016-02-08','2016-02-11'],
    [2016,5,'2016-02-15','2016-02-26','2016-02-22','2016-02-25'],
    [2016,6,'2016-02-29','2016-03-11','2016-03-07','2016-03-10'],
    [2016,7,'2016-03-14','2016-03-25','2016-03-21','2016-03-24'],
    [2016,8,'2016-03-28','2016-04-08','2016-04-04','2016-04-07'],
    [2016,9,'2016-04-11','2016-04-22','2016-04-18','2016-04-21'],
    [2016,10,'2016-04-25','2016-05-06','2016-05-02','2016-05-05'],
    [2016,11,'2016-05-09','2016-05-20','2016-05-16','2016-05-19'],
    [2016,12,'2016-05-23','2016-06-03','2016-05-30','2016-06-02'],
    [2016,13,'2016-06-06','2016-06-17','2016-06-13','2016-06-16'],
    [2016,14,'2016-06-20','2016-07-01','2016-06-27','2016-06-30'],
    [2016,15,'2016-07-04','2016-07-15','2016-07-11','2016-07-14'],
    [2016,16,'2016-07-18','2016-07-29','2016-07-25','2016-07-28'],
    [2016,17,'2016-08-01','2016-08-12','2016-08-08','2016-08-11'],
    [2016,18,'2016-08-15','2016-08-26','2016-08-22','2016-08-25'],
    [2016,19,'2016-08-29','2016-09-09','2016-09-06','2016-09-08'],
    [2016,20,'2016-09-12','2016-09-23','2016-09-19','2016-09-22'],
    [2016,21,'2016-09-26','2016-10-07','2016-10-03','2016-10-06'],
    [2016,22,'2016-10-10','2016-10-21','2016-10-17','2016-10-20'],
    [2016,23,'2016-10-24','2016-11-04','2016-10-31','2016-11-03'],
    [2016,24,'2016-11-07','2016-11-18','2016-11-14','2016-11-17'],
    [2016,25,'2016-11-21','2016-12-02','2016-11-28','2016-12-01'],
    [2016,26,'2016-12-06','2016-12-16','2016-12-12','2016-12-15']
  ];
  var query = 'INSERT INTO payroll ('
                + 'year, '
                + 'period_number, '
                + 'period_start_date , '
                + 'period_end_date , '
                + 'timesheet_due_date , '
                + 'pay_date '
              + ') '
              + 'VALUES (?, ?, ?, ?, ?, ?)';
  for (var i = payrollPeriods.length - 1; i >= 0; i--) {
    tx.executeSql(
      query,
      [
        payrollPeriods[i][0],
        payrollPeriods[i][1],
        payrollPeriods[i][2],
        payrollPeriods[i][3],
        payrollPeriods[i][4],
        payrollPeriods[i][5]
      ],
      function (tx, r) {
        console.log(r.insertId);
      }
    );
  }
}

TT.calculatePay = function (event) {
  payDate = event.data.payDate;
  TT.db.transaction(
    function (tx) {
      tx.executeSql(
        'SELECT '
          + 'pay_rate_regular, '
          + 'pay_rate_premium, '
          + 'pay_rate_admin '
        + 'FROM settings',
        [],
        function (tx, results) {
          TT.pay_rate_premium = results.rows[0].pay_rate_premium;
          TT.pay_rate_regular = results.rows[0].pay_rate_regular;
          TT.pay_rate_admin = results.rows[0].pay_rate_admin;
          console.log(payDate);
          tx.executeSql(
            'SELECT * FROM payroll WHERE '
              + 'pay_date = ?',
            [payDate],
            function (tx, results) {
              var dateRangeClause = "BETWEEN '"
                + results.rows[0].period_start_date
                + "' AND '"
                + results.rows[0].period_end_date
                + "'";
              console.log(dateRangeClause);
              tx.executeSql(
                'SELECT SUM ( '
                  + ' ( lessons_premium * ? ) '
                  + ' + ( lessons_regular * ? ) '
                  + ' + ( lessons_admin * ? ) '
                  + ') AS pay_amount FROM time_entry '
                  + 'WHERE entry_date '
                  + dateRangeClause,
                [
                  TT.pay_rate_premium,
                  TT.pay_rate_regular,
                  TT.pay_rate_admin
                ],
                function (tx, results) {
                  if (results.rows[0].pay_amount) {
                    $("#" + TT.payDayName + " .day-type").html('<a>$' + results.rows[0].pay_amount.toFixed(2)) + '</a>';
                    $("#" + TT.payDayName + " .day-type").addClass("pay-amount");
                  }
                }
              );
            }
          );
        }
      );
    }
  );
}