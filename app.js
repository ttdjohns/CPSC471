'use strict';
const mysql = require('mysql');
var debug = require('debug');
var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

//var routes = require('./routes/index');
//var users = require('./routes/users');

var app = express();
app.use(bodyParser.json());

const DBPORT = 3306;
const ADMIN_PERMISSION_LEVEL = 3;
const TEAM_MANAGER_PERMISSION_LEVEL = 2;
const WORKER_PERMISSION_LEVEL = 1;


app.get('/', (req, res) => res.send('Hello world'));

app.set('port', process.env.PORT || 3000);

var server = app.listen(app.get('port'), function () {
    debug('Express server listening on port ' + server.address().port);
});

/*
 * request
 *      { "Username": "ttdjohns",
	"Password": "ttdjohns"
}
 *
 * response
 * {
    "status": true,
    "id": 1,
    "Access_level": 2
}
*/
app.post('/login', async function (req, res) {
    // connect to db
    var con = connectToDB();
    // q db
    var p1 = new Promise(function (resolve, reject) {
        var str = 'select * from ProjectProDB.ACCOUNT_ACCESS where Username = \'' + req.body.Username + '\' and Password = \'' + req.body.Password + '\';';
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve({ status: false, id: -1, Access_level: -1 });
            }
            else if (Object.keys(rows).length > 0) {
                resolve({ status: true, id: rows[0].Worker_ID, Access_level: rows[0].Access_level });
            }
            else {
                resolve({ status: false, id: -1, Access_level: -1 });
            };
        });
    });

    async function f(p1) {
        let p1V = await p1;

        con.end();
        console.log('connection closed');
        res.send(p1V);
    }
    f(p1);
}); 

/*
 * request
 *      { "id": 1 }
 * 
 * response 
 * {
 * "status": true,
    "First_name": "Trent",
    "Last_name": "Johnston",
    "Emails": [
        "dsoifasodign@gmail.com",
        "ttdjohnston@gmail.com"
    ],
    "Phone_numbers": [
        "12342363456",
        "29835712394"
    ]
}
 */
app.post('/listWorkerDetails', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select w.First_name, w.Last_name
                    from (ProjectProDB.WORKERS as w)
                    where w.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(rows[0]);
                }
            });
        });

        var p2 = new Promise(function (resolve, reject) {
            var str = `select e.Email
                    from (ProjectProDB.WORKER_EMAILS as e) 
                    where e.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    var list = [];
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        //console.log(i);
                        list.push(rows[i].Email);
                    }
                    console.log(list);
                    resolve(list);
                }
            });
        });

        var p3 = new Promise(function (resolve, reject) {
            var str = `select p.Phone_number
                    from (ProjectProDB.WORKER_PHONE_NUMBERS as p)
                    where p.Worker_ID = ` + req.body.id + ';';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    var list = [];
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        list.push(rows[i].Phone_number);
                    }
                    console.log(list);
                    resolve(list);
                }
            });
        });


        async function f(p1, p2, p3) {

            let p1V = await p1;
            let p2V = await p2;
            let p3V = await p3;

            var ret = {
                "status": true,
                First_name: p1V.First_name,
                Last_name: p1V.Last_name,
                Emails: p2V,
                Phone_numbers: p3V
            };

            res.send(ret);
        }

        f(p1, p2, p3);


        connection.end();
        console.log('connection closed');
    }
    else {
        res.send({ "status": false });
    }
});

/*
 * request
 *     { "id": 1,
"First_name": "Trentt",
"Last_name": "Johnston",
"Phone_numbers": ["3214433435", "231432897"],
"Emails": ["qoewiniwo@fdoianfo.saiodn", "sdasifnanw@ioan.sdin"]
}
 *
 * response
 * {
    "status": true
}
*/
app.post('/editWorker', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var emailDuplicates = false;
        var allValidEmails = true;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Emails.length; i++) {
            var hasDot = (req.body.Emails[i]).includes(".");
            var hasAt = (req.body.Emails[i]).includes("@");
            if (!(hasDot && hasAt)) {
                allValidEmails = false;
            }
            for (var j = i + 1; j < req.body.Emails.length; j++) {
                if ((req.body.Emails[i]) == (req.body.Emails[j])) {
                    emailDuplicates = true;
                };
            }
        }
        if (!emailDuplicates) {
            if (allValidEmails) {
                var phoneDuplicates = false;
                var allValidPhoneNumbers = true;
                // ensure there are no duplicates in the new entries
                for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                    for (var j = 0; j < (req.body.Phone_numbers[i]).length; j++) {
                        if (!((!isNaN(parseInt((req.body.Phone_numbers[i]).charAt(j), 10)))
                            || ((req.body.Phone_numbers[i]).charAt(j) == '-')
                            || ((req.body.Phone_numbers[i]).charAt(j) == '(')
                            || ((req.body.Phone_numbers[i]).charAt(j) == ')'))) {
                            allValidPhoneNumbers = false;
                        }
                    }
                    for (var j = i + 1; j < req.body.Phone_numbers.length; j++) {
                        if ((req.body.Phone_numbers[i]) == (req.body.Phone_numbers[j])) {
                            phoneDuplicates = true;
                        };
                    }
                }
                if (!phoneDuplicates) {
                    if (allValidPhoneNumbers) {
                        var connection = connectToDB();
                        var p1 = new Promise(function (resolve, reject) {
                            var str = `update ProjectProDB.WORKERS 
                    set First_name = \'` + req.body.First_name + `\', Last_name = \'` + req.body.Last_name + `\'
                    where Worker_ID = ` + req.body.id + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        });
                        var p2 = await (new Promise(function (resolve, reject) {
                            var str = `delete from ProjectProDB.WORKER_EMAILS 
                    where Worker_ID = ` + req.body.id + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        }));
                        var p3 = new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Emails.length; i++) {
                                var str = `insert ProjectProDB.WORKER_EMAILS 
                                values (` + req.body.id + ', \'' + req.body.Emails[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        });
                        var p4 = await (new Promise(function (resolve, reject) {
                            var str = `delete from ProjectProDB.WORKER_PHONE_NUMBERS 
                    where Worker_ID = ` + req.body.id + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        }));

                        var p5 = new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                                var str = `insert ProjectProDB.WORKER_PHONE_NUMBERS
                                values (` + req.body.id + ', \'' + req.body.Phone_numbers[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        });
                        async function f(p1, p2, p3, p4, p5) {

                            let p1V = await p1;
                            let p2V = p2;
                            let p3V = await p3;
                            let p4V = p4;
                            let p5V = await p5;

                            res.send({ status: (p1V && p2V && p3V && p4V && p5V) });
                        }
                        f(p1, p2, p3, p4, p5);
                        connection.end();
                        console.log('connection closed');
                    }
                    else {
                        res.send({
                            status: false,
                            error_message: "Error: Invalid phone number(s) given"
                        });
                    }
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Duplicate Phone numbers given"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Invalid Email(s) given"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Duplicate Emails given"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request
 *      { "id": 1 }
 *
 * response    
 * {
 *  "status": true,
    "Strengths": [
        "5 Str",
        "First Str",
        " 2 Str",
        "3 Str",
        "DSFAPO3 Str"
    ]
    }
*/
app.post('/listWorkerStrengths', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select s.*, whs.Strength_rank 
                            from ((ProjectProDB.WORKER_HAS_STRENGTHS as whs) join (ProjectProDB.STRENGTHS as s) on whs.Strength_ID = s.Strength_ID)
                            where whs.Worker_ID = ` + req.body.id +
                            ' order by whs.Strength_rank asc;';
                //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {

                    resolve(rows);
                }
            });
        });
            
        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push({
                    Strength_ID: p1V[i].Strength_ID,
                    Strength_name: p1V[i].Strength_name,
                    Strength_description: p1V[i].Strength_description,
                    Strength_rank: p1V[i].Strength_rank
                });
            }
            var ret = { "status": true, Strengths: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

/*
 * request
 *      { "id": 1 }
 *
 * response    
 *{
    "status": true,
    "Strengths": [
        {
            "Strength_ID": 1,
            "Strength_name": "First Str",
            "Strength_description": ""
        },
        {
            "Strength_ID": 2,
            "Strength_name": " 2 Str",
            "Strength_description": ""
        },
        {
            "Strength_ID": 3,
            "Strength_name": "3 Str",
            "Strength_description": ""
        }
    ]
}
*/
app.post('/listStrengths', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.STRENGTHS as s);`;
            //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {

                    resolve(rows);
                }
            });
        });

        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push({
                    Strength_ID: p1V[i].Strength_ID,
                    Strength_name: p1V[i].Strength_name,
                    Strength_description: p1V[i].Strength_description
                });
            }
            var ret = { "status": true, Strengths: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

function connectToDB() {
    var connection = mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'root',
        database: 'ProjectProDB'
    });
    console.log('connection opened');
    return connection;
}

function verifyPermissions(id, reqLevel) {
    var con = connectToDB();
    var promise = new Promise(function (resolve, reject) {
        var str = 'select Access_level from ProjectProDB.ACCOUNT_ACCESS where Worker_ID = ' + id.toString();
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve(0);
            }
            else if ((rows[0].Access_level) >= (reqLevel)) {
                resolve(rows[0].Access_level);
            }
            else { resolve(0); };
        });
    });
    let retValue = promise.then(value => {
        return value;
    });
    con.end();
    console.log('connection closed in verify permissions');
    return retValue;
}

/*
 * request      (note that the Strength is the Strength_ID and the order indicates the rank. Strength[0] is your best)
 *              (always must have 5 strengths)
 *      { "id": 1,
        "Strength_IDs": [2, 3, 4, 5, 1]     
        }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editWorkerStrengths', async function (req, res) {
    // check for permissions
    if ((req.body.Strength_IDs.length == 5) && (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL))) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Strength_IDs.length; i++) {
            for (var j = i + 1; j < req.body.Strength_IDs.length; j++) {
                if ((req.body.Strength_IDs[i]) == (req.body.Strength_IDs[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.WORKER_HAS_STRENGTHS 
                    where Worker_ID = ` + req.body.id + ';';
                //console.log(str);
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {

                        resolve(true);
                    }
                });
            });

            var p2 = new Promise(function (resolve, reject) {
                for (var i = 0; i < req.body.Strength_IDs.length; i++) {
                    var str = `insert ProjectProDB.WORKER_HAS_STRENGTHS 
                                values (` + req.body.id + ', ' + req.body.Strength_IDs[i] + ', ' + i + ');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            });
            async function f(p1, p2) {

                let p1V = await p1;
                let p2V = await p2;
                connection.end();
                console.log('connection closed');
                res.send({ status: (p1V && p2V) });
            }
            f(p1, p2);
        }
        else { res.send({ status: false }) };
    }
    else {
        res.send({ status: false });
    }
}); 

/*
 * request     
 *      { "id": 1    
        }
 *
 * response    
 * {
    "status": true,
    "Desires": [
        {
            "Task_ID": 1,
            "Task_name": "weiof",
            "Task_description": ""
        },
        {
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": ""
        },
        {
            "Task_ID": 3,
            "Task_name": "fasiodfna",
            "Task_description": ""
        }
    ]
}
*/
app.post('/listDesiredTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `select t.Task_ID, t.Task_name, t.Task_description 
                            from ((ProjectProDB.DESIRES as d) join (ProjectProDB.TASKS as t) on d.Task_ID = t.Task_ID)
                            where d.Worker_ID = ` + req.body.id ;
            //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {

                    resolve(rows);
                }
            });
        });

        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push({
                    Task_ID: p1V[i].Task_ID,
                    Task_name: p1V[i].Task_name,
                    Task_description: p1V[i].Task_description
                });
            }
            var ret = { "status": true, Desires: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

/*
 * request          
 *      { "id": 1,
        "Task_IDs": [1, 2]
        }
 *
 * response
 * {
    "status": true
}
*/
app.post('/editWorkerDesires', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var duplicates = false;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Task_IDs.length; i++) {
            for (var j = i + 1; j < req.body.Task_IDs.length; j++) {
                if ((req.body.Task_IDs[i]) == (req.body.Task_IDs[j])) {
                    duplicates = true;
                };
            }
        }
        if (!duplicates) {
            // connect to db
            var connection = connectToDB();
            // q db

            var p1 = await (new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.DESIRES
                    where Worker_ID = ` + req.body.id + ';';
                //console.log(str);
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {

                        resolve(true);
                    }
                });
            }));

            var p2 = await (new Promise(function (resolve, reject) {
                for (var i = 0; i < req.body.Task_IDs.length; i++) {
                    var str = `insert ProjectProDB.DESIRES 
                                values (` + req.body.Task_IDs[i] + ', \'' + req.body.id + '\');';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        };
                    });
                };
                resolve(true);
            }));
            connection.end();
            console.log('connection closed');
            res.send({ status: (p1 && p2) });
        }
        else { res.send({ status: false }) };
    }
    else {
        res.send({ status: false });
    }
}); 

/*
 * request  
 *      { "id": 2    
        }
 *
 * response     
 *              
 * {
    "status": true,
    "Assigned_tasks": [
        {
            "Task_ID": 1,
            "Task_name": "weiof",
            "Task_description": "",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around"
        },
        {
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": "",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around"
        }
    ]
}
*/
app.post('/listAssignedTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var connection = connectToDB();
        var p1 = new Promise(function (resolve, reject) {
            var str = `select t.Task_ID, t.Task_name, t.Task_description, p.Project_ID, p.Project_name, p.Project_description
                            from (((ProjectProDB.PROJECT_TASKS as pt) join (ProjectProDB.TASKS as t) on pt.Task_ID = t.Task_ID)
                                    join (ProjectProDB.PROJECTS as p) on pt.Project_ID = p.Project_ID) 
                            where pt.Worker_ID = ` + req.body.id;
            //console.log(str);
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else { resolve(rows); }
            });
        });

        async function f(p1) {
            let p1V = await p1;
            var list = [];
            for (var i = 0; i < Object.keys(p1V).length; i++) {
                list.push({
                    Task_ID: p1V[i].Task_ID,
                    Task_name: p1V[i].Task_name,
                    Task_description: p1V[i].Task_description,
                    Project_ID: p1V[i].Project_ID,
                    Project_name: p1V[i].Project_name,
                    Project_description: p1V[i].Project_description
                });
            }
            var ret = { "status": true, Assigned_tasks: list };

            connection.end();
            console.log('connection closed');
            res.send(ret);
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 


/*
 * request { "id": 1 }
 *     
 *
 * response 
 * {
    "status": true,
    "Workers": [
        {
            "Worker_ID": 1,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Trent",
            "Last_name": "Johnston",
            "Worker_type": "Employee"
        },
        {
            "Worker_ID": 2,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Arthur",
            "Last_name": "L",
            "Worker_type": "Employee"
        }
    ]
}
 * 
*/
app.post('/listWorkers', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = 'select * from ProjectProDB.WORKERS';
        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var list = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    list.push({
                        Worker_ID: rows[i].Worker_ID,
                        Start_date: rows[i].Start_date,
                        First_name: rows[i].First_name,
                        Last_name: rows[i].Last_name,
                        Worker_type: rows[i].Worker_type
                    });
                }
                res.send({ status: true, Workers: list });
            };
        });
        connection.end();
        console.log('connection closed in allWorkers');
    }
    else {
        res.send({ status: false });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1    <<opt>>
}
 *     
 *
 * response 
 * {
    "status": true,
    "Workers": [
        {
            "Worker_ID": 2,
            "First_name": "Arthur",
            "Last_name": "Iwaniszyn",
            "Worker_type": "Employee"
        },
        {
            "Worker_ID": 3,
            "First_name": "Anton",
            "Last_name": "Lysov",
            "Worker_type": "Employee"
        }
    ]
}
 * 
*/
app.post('/listTeamWorkers', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL) && (!(await checkExists(req.body.id, "TEAMS", "Supervisor_ID")))) {
            res.send({
                currentStatus: false,
                error_message: "Team manager is not currently supervising a team"
            });
        }
        else {
            var connection = connectToDB();
            // q db
            var str = "";
            if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
                str = `select w.Worker_ID, w.First_name, w.Last_name, w.Worker_type from ((ProjectProDB.WORKERS as w) join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                    where ipo.Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
            }
            else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
                str = `select w.Worker_ID, w.First_name, w.Last_name, w.Worker_type from ((ProjectProDB.WORKERS as w) join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                    where ipo.Team_ID = ` + req.body.Team_ID + ';';
            }
            if (str != "") {
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.send({ status: false });
                    }
                    else {
                        var ret = {
                            status: true,
                            Workers: []
                        }
                        for (var i = 0; i < Object.keys(rows).length; i++) {
                            ret.Workers.push({
                                Worker_ID: rows[i].Worker_ID,
                                First_name: rows[i].First_name,
                                Last_name: rows[i].Last_name,
                                Worker_type: rows[i].Worker_type
                            })
                        }
                        res.send(ret);
                    };
                });
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: organization manager must specify Team_ID"
                })
            }
            connection.end();
            console.log('connection closed in listTeamWorkers');
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Worker_ID": 3,
"Team_ID": [1]        <<opt>>
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addWorkerToTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var currentStatus = true;
        if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID == undefined)) {
            res.send({
                currentStatus: false,
                error_message: "Admin must provide Team_ID"
            })
        }
        else if ((permission == TEAM_MANAGER_PERMISSION_LEVEL) && (!(await checkExists(req.body.id, "TEAMS", "Supervisor_ID")))) {
             res.send({
                currentStatus: false,
                error_message: "Team manager is not currently supervising a team"
             });
        }
        else {
            for (var i = 0; ((i < req.body.Team_ID.length) || ((permission == TEAM_MANAGER_PERMISSION_LEVEL) && (i < 1))); i++) {
                var str = "";
                if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
                    str = `insert into ProjectProDB.IS_PART_OF
                    values (` + req.body.Worker_ID + `, (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + '));';
                }
                else {
                    str = `insert into ProjectProDB.IS_PART_OF
                    values (` + req.body.Worker_ID + `, ` + req.body.Team_ID[i] + ');';
                }
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        currentStatus = currentStatus && false;
                    }
                    else {
                        currentStatus = currentStatus && true;
                    };
                });

            }
            res.send({"status": currentStatus })
        }
        connection.end();
        console.log('connection closed in addWorkerToTeam');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Worker_ID": 3,
"Team_ID": 1        <<opt>>
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeWorkerFromTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL)
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL) && (req.body.id != req.body.Worker_ID)) {
            str = `delete from ProjectProDB.IS_PART_OF
                    where Worker_ID = ` + req.body.Worker_ID + ` and Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `delete from ProjectProDB.IS_PART_OF
                    where Worker_ID = ` + req.body.Worker_ID + ` and Team_ID = ` + req.body.Team_ID + `
                    and Worker_ID not in (select Supervisor_ID from ProjectProDB.TEAMS where Team_ID = ` + req.body.Team_ID + `);`;
        }
        if (str != "") {
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else if (rows.affected_rows > 0 ){
                    res.send({ status: true });
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Worker_ID undefined or attemped to remove Team Supervisor from Team"
                    })
                }
            });
        }
        else {
            res.send({
                status: false,
                error_message: "Error: organization manager must specify Team_ID"
            })
        }
        connection.end();
        console.log('connection closed in deleteWorkerFromTeam');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request      (Team_ID is an required parameter if you are an organization manager
 *                  With Team_ID; see all projects that the team is working on
 *                  without Team_ID; see all projects)
 * { "id": 1,
"Team_ID": 1   <<opt>>
}
 *     
 *
 * response 
 * {
    "status": true,
    "Projects": [
        {
            "Project_ID": 3,
            "Project_name": "hanging",
            "Project_description": "your best wind chime impression"
        },
        {
            "Project_ID": 4,
            "Project_name": "electric chair",
            "Project_description": "what happens next will shock you"
        }
    ]
}
 * 
*/
app.post('/listProjects', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = "";
        if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
            str = `select p.Project_ID, p.Project_name, p.Project_description
                    from (((ProjectProDB.PROJECTS as p) join (ProjectProDB.WORKS_ON as wo) on p.Project_ID = wo.Project_ID)
                        join (ProjectProDB.TEAMS as t) on wo.Team_ID = t.Team_ID)
                    where t.Team_ID = (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + ');';
        }
        else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
            str = `select p.Project_ID, p.Project_name, p.Project_description
                    from (((ProjectProDB.PROJECTS as p) join (ProjectProDB.WORKS_ON as wo) on p.Project_ID = wo.Project_ID)
                        join (ProjectProDB.TEAMS as t) on wo.Team_ID = t.Team_ID)
                    where t.Team_ID = ` + req.body.Team_ID + ';';
        }
        else {
            str = `select * from (ProjectProDB.PROJECTS as p);`;
        }
        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var ret = {
                    status: true,
                    Projects: []
                }
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    ret.Projects.push({
                        Project_ID: rows[i].Project_ID,
                        Project_name: rows[i].Project_name,
                        Project_description: rows[i].Project_description
                    })
                }
                res.send(ret);
            };
        });

        connection.end();
        console.log('connection closed in listProjects');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1,   <<opt>>
"Project_ID": 3,
"Project_name": "Lethal Injection",
"Project_description": "Just like a flu shot"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = `update ProjectProDB.PROJECTS set Project_name = \'` + req.body.Project_name + `\', 
                Project_description = \'` + req.body.Project_description + '\' where Project_ID = ' + req.body.Project_ID + ';'

        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var ret = {
                    status: true
                }
                res.send(ret);
            };
        });

        connection.end();
        console.log('connection closed in editProject');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

function getNextPrimary(tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        var str = `select max(` + keyName + `) as maximum from ProjectProDB.` + tableName + ';';
        con.query(str, (err, rows) => {
            if (err) {
                console.log(err);
                resolve(-1);
            }
            else if (rows[0].maximum != null) {
                resolve((rows[0].maximum) + 1);
            }
            else {
                resolve(1);
            }
        });
    });
    con.end();
    return p1;
}


/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1,   <<opt>>
"Project_name": "Injection",
"Project_description": "Just like a flu shot"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    if (permission) {
        if (!(await checkExists(req.body.Project_name, "PROJECTS", "Project_name"))) {
            if (((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) ||
                (permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
                if ((permission == ADMIN_PERMISSION_LEVEL) || (await checkExists(req.body.id, "TEAMS", "Supervisor_ID"))) {
                    console.log('permission granted');
                    var nextPrime = await getNextPrimary("PROJECTS", "Project_ID");
                    // connect to db
                    var connection = connectToDB();
                    var p1 = await (new Promise(function (resolve, reject) {
                        var str = `insert into ProjectProDB.PROJECTS
                    values (` + nextPrime + `, \'` + req.body.Project_name + `\', \'` + req.body.Project_description + `\');`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }));
                    var str = "";
                    if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                        str = `insert into ProjectProDB.WORKS_ON
                    values (` + nextPrime + `, (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ` + req.body.id + '));';
                    }
                    else {
                        str = `insert into ProjectProDB.WORKS_ON
                    values (` + nextPrime + `, ` + req.body.Team_ID + ');';
                    }
                    var p2 = await (new Promise(function (resolve, reject) {
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }));
                    res.send({ status: (p1 && p2) });
                    connection.end();
                    console.log('connection closed in addProject');
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Team manager does not currently supervise a team"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Organization manager must specify a Team to be initially working on the project"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Project Name already exists"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 1,
"Team_ID": 1,   <<opt>>
"Project_ID": 2
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeTeamFromProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    console.log(permission);
    if (((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) ||
        (permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        if ((permission == TEAM_MANAGER_PERMISSION_LEVEL) && (!(await checkExists(req.body.id, "TEAMS", "Supervisor_ID")))) {
            res.send({
                currentStatus: false,
                error_message: "Team manager is not currently supervising a team"
            });
        }
        else {
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = "";
                if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
                    str = `delete from ProjectProDB.PROJECT_TASKS
                        where Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `))
                                and Project_ID = ` + req.body.Project_ID + `;`;
                }
                else {
                    str = `delete from ProjectProDB.PROJECT_TASKS
                        where Project_ID = ` + req.body.Project_ID + ` and 
                        Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo) where ipo.Team_ID = ` + req.body.Team_ID + `);`;
                }
                console.log(str);
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            var p2 = await (new Promise(function (resolve, reject) {
                var str = "";
                if ((permission == TEAM_MANAGER_PERMISSION_LEVEL)) {
                    str = `delete from ProjectProDB.WORKS_ON
                    where Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t) where Supervisor_ID = ` + req.body.id + `) 
                           and Project_ID = ` + req.body.Project_ID + `; `;
                }
                else {
                    str = `delete from ProjectProDB.WORKS_ON
                    where Team_ID = ` + req.body.Team_ID + `
                           and Project_ID = ` + req.body.Project_ID + `; `;
                }
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            var p3 = await (new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.PROJECTS
                    where Project_ID not in (select Project_ID from ProjectProDB.WORKS_ON);`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));

            res.send({ status: (p1 && p2 && p3) });
            connection.end();
            console.log('connection closed in removeTeamFromProject');
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions or organization manager must specify Team_ID"
        });
    }
});

/*
 * request      (Team_ID is optional if you are an organization manager) (Project_ID is necessary)
 * { "id": 1,
"Team_ID": 1,   <<opt>>
"Project_ID": 2
}
 *     
 *
 * response 
 *{
    "status": true,
    "Project_tasks": [
        {
            "Worker_ID": 2,
            "Worker_first_name": "Arthur",
            "Worker_last_name": "Iwaniszyn",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around",
            "Task_ID": 1,
            "Task_name": "tie the noose",
            "Task_description": "your best sailor impression",
            "Team_ID": 1,
            "Team_name": "capital punishment"
        },
        {
            "Worker_ID": 2,
            "Worker_first_name": "Arthur",
            "Worker_last_name": "Iwaniszyn",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around",
            "Task_ID": 2,
            "Task_name": "asoidfna",
            "Task_description": "",
            "Team_ID": 1,
            "Team_name": "capital punishment"
        },
        {
            "Worker_ID": 3,
            "Worker_first_name": "Anton",
            "Worker_last_name": "Lysov",
            "Project_ID": 2,
            "Project_name": "dream team",
            "Project_description": "the best around",
            "Task_ID": 4,
            "Task_name": "plug in the chair",
            "Task_description": "dont stand in water",
            "Team_ID": 1,
            "Team_name": "capital punishment"
        }
    ]
}
 * 
*/
app.post('/listProjectTasks', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    if (permission && (req.body.Project_ID != undefined)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        var p1 = await (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `select * from (((((ProjectProDB.PROJECT_TASKS as pt) join (ProjectProDB.WORKERS as w) on pt.Worker_ID = w.Worker_ID)
                                join (ProjectProDB.TASKS as t) on pt.Task_ID = t.Task_ID) 
                                join (ProjectProDB.PROJECTS as p) on p.Project_ID = pt.Project_ID)
                                join (ProjectProDB.TEAMS as te) on te.Team_ID = pt.Team_ID)
                        where pt.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `))
                                and pt.Project_ID = ` + req.body.Project_ID + `;`;
            }
            else if ((permission == ADMIN_PERMISSION_LEVEL) && (req.body.Team_ID != undefined)) {
                str = `select * from (((((ProjectProDB.PROJECT_TASKS as pt) join (ProjectProDB.WORKERS as w) on pt.Worker_ID = w.Worker_ID)
                                join (ProjectProDB.TASKS as t) on pt.Task_ID = t.Task_ID) 
                                join (ProjectProDB.PROJECTS as p) on p.Project_ID = pt.Project_ID)
                                join (ProjectProDB.TEAMS as te) on te.Team_ID = pt.Team_ID)
                        where pt.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID = ` + req.body.Team_ID + `)
                                and pt.Project_ID = ` + req.body.Project_ID + `;`;
            }
            else {
                str = `select * from (((((ProjectProDB.PROJECT_TASKS as pt) join (ProjectProDB.WORKERS as w) on pt.Worker_ID = w.Worker_ID)
                                join (ProjectProDB.TASKS as t) on pt.Task_ID = t.Task_ID) 
                                join (ProjectProDB.PROJECTS as p) on p.Project_ID = pt.Project_ID)
                                join (ProjectProDB.TEAMS as te) on te.Team_ID = pt.Team_ID)
                        where pt.Project_ID = ` + req.body.Project_ID + `;`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        if (p1) {
            var list = [];
            for (var i = 0; i < Object.keys(p1).length; i++) {
                list.push({
                    Worker_ID: p1[i].Worker_ID,
                    Worker_first_name: p1[i].First_name,
                    Worker_last_name: p1[i].Last_name,
                    Project_ID: p1[i].Project_ID,
                    Project_name: p1[i].Project_name,
                    Project_description: p1[i].Project_description,
                    Task_ID: p1[i].Task_ID,
                    Task_name: p1[i].Task_name,
                    Task_description: p1[i].Task_description,
                    Team_ID: p1[i].Team_ID,
                    Team_name: p1[i].Team_name
                })
            }

            res.send({ status: true, Project_tasks: list });
        } else { res.send({ status: false, error_message: "an error occured" }); }
        connection.end();
        console.log('connection closed in listProjectTasks');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions or must specify Project_ID"
        });
    }
});

/*
 * request                  (Team_ID is required if you are an organization manager)
 * { "id": 1,
"Project_ID": 2,
"Worker_ID": 2,
"Task_ID": 2,
"Team_ID": 1   <<opt>>
}
 *     
 *
 * response 
 *{
    "status": true
}
 * 
*/
app.post('/removeProjectTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    if (permission && (req.body.Project_ID != undefined) && (req.body.Worker_ID != undefined) && (req.body.Task_ID != undefined)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        var p1 = await (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `delete from ProjectProDB.PROJECT_TASKS
                        where Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `))
                                and Worker_ID = ` + req.body.Worker_ID + ` 
                                and Task_ID = ` + req.body.Task_ID + `
                                and Project_ID = ` + req.body.Project_ID + `
                                and Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `);`;
            }
            else {
                str = `delete from ProjectProDB.PROJECT_TASKS
                        where Worker_ID = ` + req.body.Worker_ID + ` 
                                and Task_ID = ` + req.body.Task_ID + `
                                and Project_ID = ` + req.body.Project_ID + `
                                and Team_ID = ` + req.body.Team_ID + `;`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        }));
        res.send({ status: p1 });
        connection.end();
        console.log('connection closed in deleteProjectTask');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions or must specify Project_ID, Task_ID and Worker_ID"
        });
    }
});

/*
 * request      (Team_ID is required if you are an organization manager)
 * { "id": 1,
"Team_ID": 1,   <<opt>>
"Task_ID": 1
}
 *     
 *
 * response 
 *{
    "status": true,
    "WorkersWithSandD": [
        {
            "Worker_ID": 2,
            "First_name": "Arthur",
            "Last_name": "Iwaniszyn",
            "Worker_type": "Employee"
        }
    ],
    "WorkersWithSnoD": [],
    "WorkersWithDnoS": [
        {
            "Worker_ID": 3,
            "First_name": "Anton",
            "Last_name": "Lysov",
            "Worker_type": "Volunteer"
        }
    ],
    "WorkersWithNoSnoD": []
}
 * 
*/
app.post('/listWorkersForTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    if (permission && (req.body.Task_ID != undefined) && ((permission == TEAM_MANAGER_PERMISSION_LEVEL) || (req.body.Team_ID != undefined))) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        var p1 = (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `select * from (((((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.WORKER_HAS_STRENGTHS as whs) on w.Worker_ID = whs.Worker_ID)
                                    join (ProjectProDB.STRENGTHS as s) on s.Strength_ID = whs.Strength_ID)
                                    join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                                    join (ProjectProDB.DESIRES as d) on w.Worker_ID = d.Worker_ID)
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `)) 
                                and ascs.Task_ID = ` + req.body.Task_ID + `
                                and d.Task_ID = ascs.Task_ID;`;
            }
            else {
                str = `select * from (((((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.WORKER_HAS_STRENGTHS as whs) on w.Worker_ID = whs.Worker_ID)
                                    join (ProjectProDB.STRENGTHS as s) on s.Strength_ID = whs.Strength_ID)
                                    join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                                    join (ProjectProDB.DESIRES as d) on w.Worker_ID = d.Worker_ID)
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID = `+ req.body.Team_ID + `) 
                                and ascs.Task_ID = ` + req.body.Task_ID + `
                                and d.Task_ID = ascs.Task_ID;`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log("Error in p1");
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var p2 = (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `select * from ((((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.WORKER_HAS_STRENGTHS as whs) on w.Worker_ID = whs.Worker_ID)
                                    join (ProjectProDB.STRENGTHS as s) on s.Strength_ID = whs.Strength_ID)
                                    join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `)) 
                                and ascs.Task_ID = ` + req.body.Task_ID + `
                                and w.Worker_ID not in (select d.Worker_ID
                                                        from (ProjectProDB.DESIRES as d)
                                                        where d.Task_ID = ascs.Task_ID);`;
            }
            else {
                str = `select * from ((((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.WORKER_HAS_STRENGTHS as whs) on w.Worker_ID = whs.Worker_ID)
                                    join (ProjectProDB.STRENGTHS as s) on s.Strength_ID = whs.Strength_ID)
                                    join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID = `+ req.body.Team_ID + `) 
                                and ascs.Task_ID = ` + req.body.Task_ID + `
                                and w.Worker_ID not in (select d.Worker_ID
                                                        from (ProjectProDB.DESIRES as d)
                                                        where d.Task_ID = ascs.Task_ID);`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log("Error in p2");
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var p3 = (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `select * from ((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.DESIRES as d) on w.Worker_ID = d.Worker_ID)
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `)) 
                                and d.Task_ID = ` + req.body.Task_ID + `
                                and w.Worker_ID not in (select whs.Worker_ID
                                                        from (((ProjectProDB.WORKER_HAS_STRENGTHS as whs)
                                                                join (ProjectProDB.STRENGTHS as s) on whs.Strength_ID = s.Strength_ID)
                                                                join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                                                        where d.Task_ID = ascs.Task_ID);`;
            }
            else {
                str = `select * from ((ProjectProDB.WORKERS as w) 
                                    join (ProjectProDB.DESIRES as d) on w.Worker_ID = d.Worker_ID)
                        where (w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID = `+ req.body.Team_ID + `)
                                and d.Task_ID = ` + req.body.Task_ID + `)
                                and w.Worker_ID not in (select whs.Worker_ID
                                                        from (((ProjectProDB.WORKER_HAS_STRENGTHS as whs)
                                                                join (ProjectProDB.STRENGTHS as s) on whs.Strength_ID = s.Strength_ID)
                                                                join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = s.Strength_ID)
                                                        where ascs.Task_ID = `+ req.body.Task_ID + `);`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log("Error in p3");
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var p4 = (new Promise(function (resolve, reject) {
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `select * from (ProjectProDB.WORKERS as w) 
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from (ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `))
                                and w.Worker_ID not in (select whs.Worker_ID
                                                        from ((ProjectProDB.WORKER_HAS_STRENGTHS as whs)
                                                                join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = whs.Strength_ID)
                                                        where ascs.Task_ID = ` + req.body.Task_ID + `)
                                and w.Worker_ID not in (select d.Worker_ID
                                                        from (ProjectProDB.DESIRES as d)
                                                        where d.Task_ID = ` + req.body.Task_ID + `);`;
            }
            else {
                str = `select * from (ProjectProDB.WORKERS as w) 
                        where w.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID = ` + req.body.Team_ID + `)
                                and w.Worker_ID not in (select whs.Worker_ID
                                                        from ((ProjectProDB.WORKER_HAS_STRENGTHS as whs)
                                                                join (ProjectProDB.ASSOCIATED_STRENGTHS as ascs) on ascs.Strength_ID = whs.Strength_ID)
                                                        where ascs.Task_ID = ` + req.body.Task_ID + `)
                                and w.Worker_ID not in (select d.Worker_ID
                                                        from (ProjectProDB.DESIRES as d)
                                                        where d.Task_ID = ` + req.body.Task_ID + `);`;
            }
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log("Error in p4");
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var strenAndDes = [];
        var p1V = await p1;
        for (var i = 0; i < Object.keys(p1V).length; i++) {
            strenAndDes.push({
                "Worker_ID": p1V[i].Worker_ID,
                "First_name": p1V[i].First_name,
                "Last_name": p1V[i].Last_name,
                "Worker_type": p1V[i].Worker_type
            })
        }
        var strenNoDes = [];
        var p2V = await p2;
        for (var i = 0; i < Object.keys(p2V).length; i++) {
            strenNoDes.push({
                "Worker_ID": p2V[i].Worker_ID,
                "First_name": p2V[i].First_name,
                "Last_name": p2V[i].Last_name,
                "Worker_type": p2V[i].Worker_type
            })
        }
        var desNoStren = [];
        var p3V = await p3;
        for (var i = 0; i < Object.keys(p3V).length; i++) {
            desNoStren.push({
                "Worker_ID": p3V[i].Worker_ID,
                "First_name": p3V[i].First_name,
                "Last_name": p3V[i].Last_name,
                "Worker_type": p3V[i].Worker_type
            })
        }
        var noStrenNoDes = [];
        var p4V = await p4;
        for (var i = 0; i < Object.keys(p4V).length; i++) {
            noStrenNoDes.push({
                "Worker_ID": p4V[i].Worker_ID,
                "First_name": p4V[i].First_name,
                "Last_name": p4V[i].Last_name,
                "Worker_type": p4V[i].Worker_type
            })
        }
        res.send({
            status: true,
            WorkersWithSandD: strenAndDes,
            WorkersWithSnoD: strenNoDes,
            WorkersWithDnoS: desNoStren,
            WorkersWithNoSnoD: noStrenNoDes
        });
        connection.end();
        console.log('connection closed in listWorkersForTask');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions, must specify Task_ID, or Organization Managers must supply a Team_ID"
        });
    }
});

/*
 * request      (Team_ID should only be there if you are an organization manager)
 * { "id": 2,
"Task_ID": 1,   <<opt>>
"Worker_ID": 2,
"Project_ID": 2,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addProjectTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), TEAM_MANAGER_PERMISSION_LEVEL);
    if (permission) {
        var inTeamOnProject = true
        if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
            inTeamOnProject = await checkExistsWhere(req.body.Worker_ID,
                "IS_PART_OF as ipo1",
                "ipo1.Worker_ID",
                `ipo1.Worker_ID in (select ipo.Worker_ID from (ProjectProDB.IS_PART_OF as ipo)
                                                where ipo.Team_ID in (select t.Team_ID from(ProjectProDB.TEAMS as t)
                                                                    where t.Supervisor_ID = ` + req.body.id + `))
            and ipo1.Worker_ID in (select w.Worker_ID from (((ProjectProDB.WORKERS as w)
                                                            join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                                                            join (ProjectProDB.WORKS_ON as wo) on wo.Team_ID = ipo.Team_ID)
                                                            where  wo.Project_ID = ` + req.body.Project_ID + ');');

        }
        else {
            inTeamOnProject = await checkExistsWhere(req.body.Worker_ID,
                "IS_PART_OF as ipo1",
                "ipo1.Worker_ID",
                `ipo1.Worker_ID in (select w.Worker_ID from (((ProjectProDB.WORKERS as w) 
                                                            join (ProjectProDB.IS_PART_OF as ipo) on w.Worker_ID = ipo.Worker_ID)
                                                            join (ProjectProDB.WORKS_ON as wo) on wo.Team_ID = ipo.Team_ID)
                                                            where wo.Project_ID = ` + req.body.Project_ID + ');');
        }
        if (inTeamOnProject) {
            console.log('permission granted');
            // connect to db
            var connection = connectToDB();
            // q db
            var str = "";
            if (permission == TEAM_MANAGER_PERMISSION_LEVEL) {
                str = `insert ProjectProDB.PROJECT_TASKS values (` + req.body.Worker_ID + `, ` + req.body.Task_ID + `, 
                        ` + req.body.Project_ID + ', (select Team_ID from ProjectProDB.TEAMS where Supervisor_ID = ' + req.body.id + '));'
            }
            else {
                str = `insert ProjectProDB.PROJECT_TASKS values (` + req.body.Worker_ID + `, ` + req.body.Task_ID + `, 
                        ` + req.body.Project_ID + ', ' + req.body.Team_ID + ');'
            }

            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true
                    }
                    res.send(ret);
                };
            });

            connection.end();
            console.log('connection closed in addProjectTask');
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Worker is not part of your team or that worker is not working on that project"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Strength_name": "Teaching",
"Strength_description": "Instructing others"
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addStrength', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("STRENGTHS", "Strength_ID");
        var nameUnique = await checkUnique(req.body.Strength_name, "STRENGTHS", "Strength_name");
        if (nameUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.STRENGTHS
                    values (` + nextPrime + `, \'` + req.body.Strength_name + `\', \'` + req.body.Strength_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in addStrength');
        } else {
            res.send({
                status: false,
                error_message: "Error: Name already exists or is invalid"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Strength_ID": 1
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeStrength', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var hasAssociated = await checkExists(req.body.Strength_ID, "ASSOCIATED_STRENGTHS", "Strength_ID");
        if (!hasAssociated) {
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.STRENGTHS where Strength_ID = ` + req.body.Strength_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in removeStrength');
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Cannot remove strength until there are no tasks associated to that strength"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Strength_ID": 1,
"Strength_name": "noaienf",
"Strength_description": "osdifnaos"
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editStrength', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var exists = await checkExists(req.body.Strength_ID, "STRENGTHS", "Strength_ID");
        if (exists) {
            if (!(await checkExistsWhere(req.body.Strength_name, "STRENGTHS", "Strength_name", "Strength_ID <> " + req.body.Strength_ID + ";"))) {
                var connection = connectToDB();
                var p1 = await (new Promise(function (resolve, reject) {
                    var str = `update ProjectProDB.STRENGTHS set Strength_name = \'` + req.body.Strength_name + `\', 
                            Strength_description = \'` + req.body.Strength_description + `\'
                            where Strength_ID = ` + req.body.Strength_ID + `;`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                res.send({ status: p1 });
                connection.end();
                console.log('connection closed in editStrength');
            } else {
                res.send({
                    status: false,
                    error_message: "Error: Strength name already exists"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Strength does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

//A function to check the database to see if the proposed name is unique
function checkUnique(proposedAttribute, tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        if ((proposedAttribute == null) || (proposedAttribute == ("")) || (proposedAttribute == undefined)) {
            resolve(false);
        } else {
            var str = `select * from ProjectProDB.` + tableName + ' where ' + keyName + ' = \'' + proposedAttribute + '\' ; ';
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    if (Object.keys(rows).length > 0) { resolve(false); }
                    else { resolve(true); }
                }
            });
        };
    });
    con.end();
    return p1;
}

//A function to check the database to see if the attribute exists in the given table
function checkExists(attToCheck, tableName, keyName) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        if ((attToCheck == null) || (attToCheck == ("")) || (attToCheck == undefined)) {
            resolve(false);
        } else {
            var str = `select * from ProjectProDB.` + tableName + ' where ' + keyName + ' = \'' + attToCheck + '\' ; ';
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    if (Object.keys(rows).length < 1) { resolve(false); }
                    else {
                        resolve(true);
                    }
                }
            });
        };
    });
    con.end();
    return p1;
}

//A function to check the database to see if the attribute exists in the given table
function checkExistsWhere(attToCheck, tableName, keyName, whereConstraint) {
    var con = connectToDB();
    var p1 = new Promise(function (resolve, reject) {
        if ((attToCheck == null) || (attToCheck == ("")) || (attToCheck == undefined)) {
            console.log(attToCheck);
            resolve(false);
        } else {
            var str = `select * from ProjectProDB.` + tableName + ' where ' + keyName + ' = \'' + attToCheck + '\' and ' + whereConstraint + '; ';
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    if (Object.keys(rows).length < 1) { console.log(rows); resolve(false); }
                    else {
                        resolve(true);
                    }
                }
            });
        };
    });
    con.end();
    return p1;
};

/*
 //* request
 * { "id": 1
}
 *     
 *
 * response 
 * {
    "status": true,
    "Teams": [
        {
            "Team_ID": 1,
            "Team_name": "capital punishment",
            "Supervisor_ID": 2
        },
        {
            "Team_ID": 2,
            "Team_name": "Assisted Suicide",
            "Supervisor_ID": 4
        }
    ]
}
 * 
*/
app.post('/listTeams', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        if (req.body.Worker_ID == undefined) {
            var str = `select * from ProjectProDB.TEAMS;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Teams: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Teams.push({
                            Team_ID: rows[i].Team_ID,
                            Team_name: rows[i].Team_name,
                            Supervisor_ID: rows[i].Supervisor_ID
                        })
                    }
                    res.send(ret);
                };
            });
        }
        else {
            var str = `select * from ((ProjectProDB.TEAMS as t) join (ProjectProDB.IS_PART_OF as ipo) on t.Team_ID = ipo.Team_ID)
                        where ipo.Worker_ID = ` + req.body.Worker_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Teams: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Teams.push({
                            Team_ID: rows[i].Team_ID,
                            Team_name: rows[i].Team_name,
                            Supervisor_ID: rows[i].Supervisor_ID
                        })
                    }
                    res.send(ret);
                };
            });
        }
        connection.end();
        console.log('connection closed in listTeams');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 //* request
 * { "id": 1,
"Project_ID": 2
}
 *     
 *
 * response 
 * {
    "status": true,
    "Teams": [
        {
            "Team_ID": 1,
            "Team_name": "capital punishment",
            "Supervisor_ID": 2
        },
        {
            "Team_ID": 2,
            "Team_name": "Assisted Suicide",
            "Supervisor_ID": 4
        }
    ]
}
 * 
*/
app.post('/listTeamsWorkingOnProject', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        if (req.body.Worker_ID == undefined) {
            var str = `select t.* from ((ProjectProDB.TEAMS as t) join (ProjectProDB.WORKS_ON as wo) on t.Team_ID = wo.Team_ID)
                        where wo.Project_ID = ` + req.body.Project_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Teams: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Teams.push({
                            Team_ID: rows[i].Team_ID,
                            Team_name: rows[i].Team_name,
                            Supervisor_ID: rows[i].Supervisor_ID
                        })
                    }
                    res.send(ret);
                };
            });
        }
        else {
            var str = `select * from (((ProjectProDB.TEAMS as t) join (ProjectProDB.IS_PART_OF as ipo) on t.Team_ID = ipo.Team_ID)
                        join (ProjectProDB.WORKS_ON as wo) on t.Team_ID = wo.Team_ID)
                        where ipo.Worker_ID = ` + req.body.Worker_ID + `, wo.Project_ID = ` + req.body.Project_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true,
                        Teams: []
                    }
                    for (var i = 0; i < Object.keys(rows).length; i++) {
                        ret.Teams.push({
                            Team_ID: rows[i].Team_ID,
                            Team_name: rows[i].Team_name,
                            Supervisor_ID: rows[i].Supervisor_ID
                        })
                    }
                    res.send(ret);
                };
            });
        }
        connection.end();
        console.log('connection closed in listTeamsWorkingOnProject');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 //* request
 * { "id": 1,
"Team_ID": 1,
"Supervisor_ID": 1,
"Team_name": "New capital punishment"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var unique = await checkExistsWhere(req.body.Team_name, "TEAMS", "Team_name", "Team_ID <> " + req.body.Team_ID + ";");
        if (!unique) {
            if (await checkExists(req.body.Supervisor_ID, "TEAMS", "Supervisor_ID")) {
                res.send({
                    status: false,
                    error_message: "Error: Worker is already managing a team"
                });
            }
            else {
                var connection = connectToDB();
                var p0 = await (new Promise(function (resolve, reject) {
                    var str = `select aa.Worker_ID, aa.Access_level 
                        from ((ProjectProDB.TEAMS as t) join (ProjectProDB.ACCOUNT_ACCESS as aa) on t.Supervisor_ID = aa.Worker_ID)
                        where t.Team_ID = ` + req.body.Team_ID + `;`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err)
                            resolve(false);
                        }
                        else if (rows[0].Access_level == 2) {
                            resolve(rows[0]);
                        }
                        else {
                            resolve(false);
                        }
                    });
                }));
                if (p0) {
                    var p0_1 = await (new Promise(function (resolve, reject) {
                        var str = `update ProjectProDB.ACCOUNT_ACCESS set Access_level = 1
                        where Worker_ID = ` + p0.Worker_ID + `;`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err)
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            };
                        });
                    }));
                }
                var p02 = await (new Promise(function (resolve, reject) {
                    var str = `select aa.Access_level 
                        from (ProjectProDB.ACCOUNT_ACCESS as aa)
                        where aa.Worker_ID = ` + req.body.Supervisor_ID + `;`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err)
                            resolve(false);
                        }
                        else if (rows[0].Access_level == 1) {
                            resolve(true);
                        }
                        else {
                            resolve(false);
                        }
                    });
                }));
                if (p02) {
                    var p02_1 = await (new Promise(function (resolve, reject) {
                        var str = `update ProjectProDB.ACCOUNT_ACCESS set Access_level = 2
                        where Worker_ID = ` + req.body.Supervisor_ID + `;`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err)
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            };
                        });
                    }));
                }
                var str = `update ProjectProDB.TEAMS set Team_name = \'` + req.body.Team_name +
                    `\', Supervisor_ID = ` + req.body.Supervisor_ID +
                    ` where Team_ID = ` + req.body.Team_ID + `;`
                    ;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.send({ status: false });
                    }
                    else {
                        var ret = {
                            status: true
                        }
                        res.send(ret);
                    };
                });
                connection.end();
                console.log('connection closed in editTeam');
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Duplicate team name"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 //* request
 * { "id": 1,
"Team_ID": 1
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var connection = connectToDB();
        var p0 = await (new Promise(function (resolve, reject) {
            var str = `select aa.Worker_ID, aa.Access_level 
                        from ((ProjectProDB.TEAMS as t) join (ProjectProDB.ACCOUNT_ACCESS as aa) on t.Supervisor_ID = aa.Worker_ID)
                        where t.Team_ID = ` + req.body.Team_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    resolve(false);
                }
                else if (rows[0].Access_level == 2) {
                    resolve(rows[0]);
                }
                else {
                    resolve(false);
                }
            });
        }));
        if (p0) {
            var p0_1 = await (new Promise(function (resolve, reject) {
                var str = `update ProjectProDB.ACCOUNT_ACCESS set Access_level = 1
                        where Worker_ID = ` + p0.Worker_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    };
                });
            }));
        }
        var p1 = await (new Promise(function (resolve, reject) {
            var str = `delete from ProjectProDB.TEAMS where Team_ID = ` + req.body.Team_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    resolve(false);
                }
                else {
                    resolve(true);
                };
            });
        }));
        var p2 = await (new Promise(function (resolve, reject) {
            var str = `delete from ProjectProDB.PROJECTS
                    where Project_ID not in (select Project_ID from ProjectProDB.WORKS_ON);`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(false);
                }
                else {
                    resolve(true);
                }
            });
        }));
        res.send({"status": (p2 && p1)})
        connection.end();
        console.log('connection closed in removeTeam');
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * 
 * request
 *      { "id": 1 }
 *
 * response
 {
    "status": true,
    "Tasks": [
        {
            "Task_ID": 5,
            "Task_name": "wieur",
            "Task_description": "",
            "Associated_strengths": []
        },
        {
            "Task_ID": 6,
            "Task_name": "Waterboarding",
            "Task_description": "Showing others how to be a fish",
            "Associated_strengths": [
                {
                    "Strength_ID": 2,
                    "Strength_name": " 2 Str",
                    "Strength_description": ""
                },
                {
                    "Strength_ID": 3,
                    "Strength_name": "3 Str",
                    "Strength_description": ""
                }
            ]
        }
    ]
}
 *
*/
app.post('/listTasks', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), WORKER_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var p1 = await (new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.TASKS as t);`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var list = [];
        for (var i = 0; i < Object.keys(p1).length; i++) {

            var p2 = await (new Promise(function (resolve, reject) {
                var str = `select * from ((ProjectProDB.ASSOCIATED_STRENGTHS as ascs) join (ProjectProDB.STRENGTHS as s) 
                            on ascs.Strength_ID = s.Strength_ID)
                            where ascs.Task_ID = ` + p1[i].Task_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve([]);
                    }
                    else {
                        resolve(rows);
                    }
                });
            }));
            var list2 = [];
            for (var j = 0; j < Object.keys(p2).length; j++) {
                list2.push({
                    Strength_ID: p2[j].Strength_ID,
                    Strength_name: p2[j].Strength_name,
                    Strength_description: p2[j].Strength_description
                });
            }

            list.push({
                Task_ID: p1[i].Task_ID,
                Task_name: p1[i].Task_name,
                Task_description: p1[i].Task_description,
                Associated_strengths: list2
            });
        }
        var ret = { "status": true, Tasks: list };

        connection.end();
        console.log('connection closed on listTasks');
        res.send(ret);

    }
    else {
        res.send({
            "status": false,
            "error_message": "Error: Invalid Permissions"
        });
    };
}); 

/*
 * request      
 * { "id": 1,
"Task_name": "Waterboarding",
"Task_description": "Showing others how to be a fish",
"Associated_strength_ID": [10, 2]
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions(req.body.id, ADMIN_PERMISSION_LEVEL);
    if (permission && (req.body.Associated_strength_ID.length > 0)) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("TASKS", "Task_ID");
        var strengthExists = true;
        for (let i = 0; i < req.body.Associated_strength_ID.length; i++) {
            strengthExists = strengthExists && (await checkExists(req.body.Associated_strength_ID[i], "STRENGTHS", "Strength_ID"));
        }
        var isUnique = await checkUnique(req.body.Task_name, "TASKS", "Task_name");
        if (strengthExists && isUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.TASKS
                    values (` + nextPrime + `, \'` + req.body.Task_name + `\', \'` + req.body.Task_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            var p2Success = true;
            for (let i = 0; i < req.body.Associated_strength_ID.length; i++) {
                var p2 = await (new Promise(function (resolve, reject) {
                    var str = `insert into ProjectProDB.ASSOCIATED_STRENGTHS
                    values (` + nextPrime + `, ` + req.body.Associated_strength_ID[i] + `);`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                p2Success = p2Success && p2;
            }
            res.send({ status: (p1 && p2Success) });
            connection.end();
            console.log('connection closed in addTask');
        }
        else {
            res.send({
                status: false,
                error_message: "Either invalid strength provided or Task name already exists"
            })
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 //* request
 * { "id": 1,
"Task_ID": 1,
"Task_name": "Euthanasia",
"Task_description": "pull the plug",
"Associated_strengths": [1,2,3]
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editTask', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var isUnique = await checkExistsWhere(req.body.Task_name, "TASKS", "Task_name", "Task_ID <> " + req.body.Task_ID + ";");
        if (isUnique) {
            var duplicates = false;
            var strengthsExists = true;
            for (var i = 0; i < req.body.Associated_strengths.length; i++) {
                var exists = (await checkExists(req.body.Associated_strengths[i], "STRENGTHS", "Strength_ID"))
                if (!exists) {
                    strengthsExists = false;
                }
                for (var j = i + 1; j < req.body.Associated_strengths.length; j++) {
                    if ((req.body.Associated_strengths[i]) == (req.body.Associated_strengths[j])) {
                        duplicates = true;
                    };
                }
            }
            if (strengthsExists) {
                if (!duplicates) {
                    var connection = connectToDB();
                    // q db
                    var p1 = await (new Promise(function (resolve, reject) {
                        var str = `update ProjectProDB.TASKS set Task_name = \'` + req.body.Task_name +
                            `\', Task_description = \'` + req.body.Task_description +
                            `\' where Task_ID = ` + req.body.Task_ID + `;`
                            ;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err)
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            };
                        });
                    }));

                    var p2 = await (new Promise(function (resolve, reject) {
                        var str = `delete from ProjectProDB.ASSOCIATED_STRENGTHS 
                    where Task_ID = ` + req.body.Task_ID + ';';
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {

                                resolve(true);
                            }
                        });
                    }));

                    var p3 = await (new Promise(function (resolve, reject) {
                        for (var i = 0; i < req.body.Associated_strengths.length; i++) {
                            var str = `insert ProjectProDB.ASSOCIATED_STRENGTHS 
                                values (` + req.body.Task_ID + ', \'' + req.body.Associated_strengths[i] + '\');';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                };
                            });
                        };
                        resolve(true);
                    }));
                    res.send({ status: (p1 && p2 && p3) });
                    connection.end();
                    console.log('connection closed in editTask');
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Duplicate Associated Strength"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: At  least one strength does not exist"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Task name is not unique"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 //* request
 * { "id": 1,
 "Worker_ID": 2,
"Password": "password",
"Access_level": 3
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editAccountAccess', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        var workerExists = checkExists(req.body.Worker_ID, "ACCOUNT_ACCESS", "Worker_ID");
        if (workerExists) {
            console.log('permission granted');
            var connection = connectToDB();
            // q db
            var str = `update ProjectProDB.ACCOUNT_ACCESS set Password = \'` + req.body.Password +
                `\', Access_level = ` + req.body.Access_level +
                ` where Worker_ID = ` + req.body.Worker_ID + `;`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send({ status: false });
                }
                else {
                    var ret = {
                        status: true
                    }
                    res.send(ret);
                };
            });
            connection.end();
            console.log('connection closed in editAccountAccess');
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Worker does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request
 *    { "id": 1,
"Worker_ID": 2
}
 *
 * response
 * {
    "status": true,
    "Username": "arthurI",
    "Access_level": 2
}
*/
app.post('/getUsernameAndPermissionLevel', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var con = connectToDB();

        var p1 = new Promise(function (resolve, reject) {
            var str = 'select Username, Access_level from ProjectProDB.ACCOUNT_ACCESS where Worker_ID = ' + req.body.Worker_ID;
            con.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve(-1);
                }
                else {
                    resolve(rows[0]);
                };
            });
        });

        async function f(p1) {
            let p1V = await p1;
            con.end();
            console.log('connection closed');
            res.send({ "status": true, Username: p1V.Username, Access_level: p1V.Access_level });
        }
        f(p1);
    }
    else { res.send({ "status": false }); };
}); 

/*
 * request              (note salary and ssn are only neccessary for employees)
 *      { "id": 1,
"First_name": "Ron",
"Last_name": "Swanson",
"Worker_type": "Employee",
"SSN": "123927402",
"Salary": 500000,
"Emails": ["sodnfansof23@sodfn.oidf","asodfin@.adon"],
"Phone_numbers": [2349023907273],
"Username": "TheSwanson",
"Password": "password",
"Access_level": 3
}
 * 
 * response 
 * {
    "status": true
}
 */
app.post('/addWorker', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        if ((req.body.Worker_type).toUpperCase() == "EMPLOYEE") {
            var validSSN = true;
            if (req.body.SSN.length != 9) {
                validSSN = false
            }
            for (var j = 0; j < req.body.SSN.length; j++) {
                if (!((!isNaN(parseInt((req.body.SSN).charAt(j), 10))))) {
                    validSSN = false;
                }
            }
            if (!validSSN) {
                return res.send({
                    status: false,
                    error_message: "Error: Invalid SSN given"
                })
            }
        }
        var emailDuplicates = false;
        var allValidEmails = true;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Emails.length; i++) {
            var hasDot = (req.body.Emails[i]).includes(".");
            var hasAt = (req.body.Emails[i]).includes("@");
            if (!(hasDot && hasAt)) {
                allValidEmails = false;
            }
            for (var j = i + 1; j < req.body.Emails.length; j++) {
                if ((req.body.Emails[i]) == (req.body.Emails[j])) {
                    emailDuplicates = true;
                };
            }
        }
        if (!emailDuplicates) {
            if (allValidEmails) {
                var phoneDuplicates = false;
                var allValidPhoneNumbers = true;
                // ensure there are no duplicates in the new entries
                for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                    for (var j = 0; j < (req.body.Phone_numbers[i]).length; j++) {
                        if (!((!isNaN(parseInt((req.body.Phone_numbers[i]).charAt(j), 10)))
                            || ((req.body.Phone_numbers[i]).charAt(j) == '-')
                            || ((req.body.Phone_numbers[i]).charAt(j) == '(')
                            || ((req.body.Phone_numbers[i]).charAt(j) == ')'))) {
                            allValidPhoneNumbers = false;
                        }
                    }
                    for (var j = i + 1; j < req.body.Phone_numbers.length; j++) {
                        if ((req.body.Phone_numbers[i]) == (req.body.Phone_numbers[j])) {
                            phoneDuplicates = true;
                        };
                    }
                }
                if (!phoneDuplicates) {
                    if (allValidPhoneNumbers) {
                        if (!(await checkExists(req.body.Username, "ACCOUNT_ACCESS", "Username"))) {
                            var nextPrimary = (await getNextPrimary("WORKERS", "Worker_ID"));
                            var connection = connectToDB();
                            var p1 = await (new Promise(function (resolve, reject) {
                                var today = new Date(); 
                                var ssn = "";
                                if (req.body.SSN != undefined) {
                                    ssn = req.body.SSN;
                                };
                                var salary = 0;
                                if (req.body.Salary != undefined) {
                                    salary = req.body.Salary;
                                };
                                var str = `insert into ProjectProDB.WORKERS 
                        values (` + nextPrimary + `, \'`
                                    + today.getFullYear() + `-`
                                    + (today.getMonth() + 1) + `-`
                                    + today.getDate() + `\',
                                \'` + req.body.First_name + `\', \'`
                                    + req.body.Last_name + `\', \'` + req.body.Worker_type
                                    + `\', \'` + ssn + `\', ` + salary + `);`;
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    }
                                    else {
                                        resolve(true);
                                    }
                                });
                            }));

                            var p2 = await (new Promise(function (resolve, reject) {
                                for (var i = 0; i < req.body.Emails.length; i++) {
                                    var str = `insert ProjectProDB.WORKER_EMAILS 
                                values (` + nextPrimary + ', \'' + req.body.Emails[i] + '\');';
                                    connection.query(str, (err, rows) => {
                                        if (err) {
                                            console.log(err);
                                            resolve(false);
                                        };
                                    });
                                };
                                resolve(true);
                            }));

                            var p3 = await (new Promise(function (resolve, reject) {
                                for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                                    var str = `insert ProjectProDB.WORKER_PHONE_NUMBERS
                                values (` + nextPrimary + ', \'' + req.body.Phone_numbers[i] + '\');';
                                    connection.query(str, (err, rows) => {
                                        if (err) {
                                            console.log(err);
                                            resolve(false);
                                        };
                                    });
                                };
                                resolve(true);
                            }));

                            var p5 = await (new Promise(function (resolve, reject) {
                                var today = new Date();
                                var str = `insert into ProjectProDB.ACCOUNT_ACCESS
                                        values (\'` + req.body.Username + `\', \'`
                                    + req.body.Password + `\',
                                                  ` + req.body.Access_level + `, `
                                    + nextPrimary + `);`;
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    }
                                    else {
                                        resolve(true);
                                    }
                                });
                            }));
                            res.send({ status: (p1 && p2 && p3 && p5) })
                            connection.end();
                            console.log('connection closed');
                        }
                        else {
                            res.send({
                                status: false,
                                error_message: "Error: Invalid username"
                            });
                        }
                    }
                    else {
                        res.send({
                            status: false,
                            error_message: "Error: Invalid phone number(s) given"
                        });
                    }
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Duplicate Phone numbers given"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Invalid Email(s) given"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Duplicate Emails given"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Worker_ID": 3
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeWorker', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var isSuper = await checkExists(req.body.Worker_ID, "TEAMS", "Supervisor_ID");
        if (!isSuper) {
            if (req.body.id != req.body.Worker_ID) {
                if (req.body.Worker_ID != 1) {
                    var connection = connectToDB();
                    var p1 = await (new Promise(function (resolve, reject) {
                        var str = `delete from ProjectProDB.WORKERS where Worker_ID = ` + req.body.Worker_ID + `;`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }));
                    res.send({ status: p1 });
                    connection.end();
                    console.log('connection closed in removeWorker');
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Cannot remove remove Primary Admin"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Cannot remove remove yourself"
                });
            }
        }
        else 
        {
            res.send({
                status: false,
                error_message: "Error: Cannot remove a supervisor of a team"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request      
 * { "id": 1,
"Cause_name": "Justice",
"Cause_description": "My perverted sense of"
}
 *     
 *
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addCause', async function (req, res) {
    // check for permissions
    var permission = verifyPermissions(req.body.id, ADMIN_PERMISSION_LEVEL);
    if (await permission) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("CAUSES", "Cause_ID");
        var isUnique = await checkUnique(req.body.Cause_name, "CAUSES", "Cause_name");
        if (isUnique) {
            // connect to db
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `insert into ProjectProDB.CAUSES
                    values (` + nextPrime + `, \'` + req.body.Cause_name + `\', \'` + req.body.Cause_description + `\');`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in addCause');
        }
        else {
            res.send({
                status: false,
                error_message: "Either invalid strength provided or Task name already exists"
            })
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * 
 * request
 *      { "id": 1 }
 *
 * response
 {
    "status": true,
    "Tasks": [
        {
            "Task_ID": 5,
            "Task_name": "wieur",
            "Task_description": "",
            "Associated_strengths": []
        },
        {
            "Task_ID": 6,
            "Task_name": "Waterboarding",
            "Task_description": "Showing others how to be a fish",
            "Associated_strengths": [
                {
                    "Strength_ID": 2,
                    "Strength_name": " 2 Str",
                    "Strength_description": ""
                },
                {
                    "Strength_ID": 3,
                    "Strength_name": "3 Str",
                    "Strength_description": ""
                }
            ]
        }
    ]
}
 *
*/
app.post('/listCauses', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var p1 = await (new Promise(function (resolve, reject) {
            var str = `select * from (ProjectProDB.CAUSES as c);`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var list = [];
        for (var i = 0; i < Object.keys(p1).length; i++) {
            var p2 = await (new Promise(function (resolve, reject) {
                var str = `select * from (((ProjectProDB.DEDICATED_TO as dt) join (ProjectProDB.CAUSES as c) on dt.Cause_ID = c.Cause_ID)
                            join (ProjectProDB.PROJECTS as p) on p.Project_ID = dt.Project_ID)
                            where dt.Cause_ID = ` + p1[i].Cause_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve([]);
                    }
                    else {
                        resolve(rows);
                    }
                });
            }));
            var list2 = [];
            for (var j = 0; j < Object.keys(p2).length; j++) {
                list2.push({
                    Project_ID: p2[j].Project_ID,
                    Project_name: p2[j].Project_name,
                    Project_description: p2[j].Project_description
                });
            }

            list.push({
                Cause_ID: p1[i].Cause_ID,
                Cause_name: p1[i].Cause_name,
                Cause_description: p1[i].Cause_description,
                Dedicated_projects: list2
            });
        }
        var ret = { "status": true, Causes: list };

        connection.end();
        console.log('connection closed on listCauses');
        res.send(ret);

    }
    else {
        res.send({
            "status": false,
            "error_message": "Error: Invalid Permissions"
        });
    };
}); 

/*
 * request  
 * { "id": 1,
"Cause_ID": 1,
"Cause_name": "qsadnfoan",
"Cause_description": "adnfoasndf",
"Projects": [1, 2]
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editCause', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var exists = await checkExists(req.body.Cause_ID, "CAUSES", "Cause_ID");
        if (exists) {
            if (!(await checkExistsWhere(req.body.Cause_name, "CAUSES", "Cause_name", "Cause_ID <> " + req.body.Cause_ID + ";"))) {
                var connection = connectToDB();
                var p1 = await (new Promise(function (resolve, reject) {
                    var str = `update ProjectProDB.CAUSES set Cause_name = \'` + req.body.Cause_name + `\', 
                            Cause_description = \'` + req.body.Cause_description + `\'
                            where Cause_ID = ` + req.body.Cause_ID + `;`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                var p2 = await (new Promise(function (resolve, reject) {
                    var str = `delete from ProjectProDB.DEDICATED_TO 
                    where Cause_ID = ` + req.body.Cause_ID + ';';
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                var p3 = await (new Promise(function (resolve, reject) {
                    for (var i = 0; i < req.body.Projects.length; i++) {
                        var str = `insert ProjectProDB.DEDICATED_TO 
                                values (` + req.body.Projects[i] + ', ' + req.body.Cause_ID + ');';
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            };
                        });
                    };
                    resolve(true);
                }));
                res.send({ status: p1 && p2 && p3 });
                connection.end();
                console.log('connection closed in editCauses');
            } else {
                res.send({
                    status: false,
                    error_message: "Error: Cause name already exists"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Cause does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Cause_ID": 1
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeCause', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var exists = await checkExists(req.body.Cause_ID, "CAUSES", "Cause_ID");
        if (exists) {
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.CAUSES where Cause_ID = ` + req.body.Cause_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in removeWorker');
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Cause does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request         
 *      { "id": 1,
"First_name": "Ron",
"Last_name": "Swanson",
"Mailing_address": "234 place street",
"Emails": ["sodnfansof23@sodfn.oidf","asodfin@.adon"],
"Phone_numbers": [2349023907273]
}
 * 
 * response 
 * {
    "status": true
}
 */
app.post('/addDonor', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var emailDuplicates = false;
        var allValidEmails = true;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Emails.length; i++) {
            var hasDot = (req.body.Emails[i]).includes(".");
            var hasAt = (req.body.Emails[i]).includes("@");
            if (!(hasDot && hasAt)) {
                allValidEmails = false;
            }
            for (var j = i + 1; j < req.body.Emails.length; j++) {
                if ((req.body.Emails[i]) == (req.body.Emails[j])) {
                    emailDuplicates = true;
                };
            }
        }
        if (!emailDuplicates) {
            if (allValidEmails) {
                var phoneDuplicates = false;
                var allValidPhoneNumbers = true;
                // ensure there are no duplicates in the new entries
                for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                    for (var j = 0; j < (req.body.Phone_numbers[i]).length; j++) {
                        if (!((!isNaN(parseInt((req.body.Phone_numbers[i]).charAt(j), 10)))
                            || ((req.body.Phone_numbers[i]).charAt(j) == '-')
                            || ((req.body.Phone_numbers[i]).charAt(j) == '(')
                            || ((req.body.Phone_numbers[i]).charAt(j) == ')'))) {
                            allValidPhoneNumbers = false;
                        }
                    }
                    for (var j = i + 1; j < req.body.Phone_numbers.length; j++) {
                        if ((req.body.Phone_numbers[i]) == (req.body.Phone_numbers[j])) {
                            phoneDuplicates = true;
                        };
                    }
                }
                if (!phoneDuplicates) {
                    if (allValidPhoneNumbers) {
                        var nextPrimary = (await getNextPrimary("DONORS", "Donor_ID"));
                        var connection = connectToDB();
                        var p1 = await (new Promise(function (resolve, reject) {
                            var str = `insert into ProjectProDB.DONORS 
                        values (` + nextPrimary + `, \'`
                                + req.body.First_name + `\', \'`
                                + req.body.Last_name + `\', \'`
                                + req.body.Mailing_address + `\');`;
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        }));

                        var p2 = await (new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Emails.length; i++) {
                                var str = `insert ProjectProDB.DONOR_EMAILS 
                                values (` + nextPrimary + ', \'' + req.body.Emails[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        }));

                        var p3 = await (new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                                var str = `insert ProjectProDB.DONOR_PHONE_NUMBERS
                                values (` + nextPrimary + ', \'' + req.body.Phone_numbers[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        }));

                        res.send({ status: (p1 && p2 && p3) })
                        connection.end();
                        console.log('connection closed');
                    }
                    else {
                        res.send({
                            status: false,
                            error_message: "Error: Invalid phone number(s) given"
                        });
                    }
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Duplicate Phone numbers given"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Invalid Email(s) given"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Duplicate Emails given"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request { "id": 1 }
 *     
 *
 * response 
 * {
    "status": true,
    "Donors": [
        {
            "Donor_ID": 1,
            "First_name": "Uncle",
            "Last_name": "Joe",
            "Mailing_address": "gulag144 Vostok ave Russia",
            "Emails": [
                "gulag144@siberia.ru"
            ],
            "Phone_numbers": [
                "7-346-2737373"
            ],
            "Donations": [
                {
                    "Donation_ID": 1,
                    "Amount": 500000000,
                    "Cause_ID": 2
                }
            ]
        }
    ]
}
 * 
*/
app.post('/listDonors', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db

        var p1 = await (new Promise(function (resolve, reject) {
            var str = 'select * from ProjectProDB.DONORS';
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err)
                    res.send([]);
                }
                else {
                    resolve(rows);
                };
            });
        }));

        var list = [];
        for (var i = 0; i < Object.keys(p1).length; i++) {
            var p2 = await (new Promise(function (resolve, reject) {
                var str = 'select * from ProjectProDB.DONOR_EMAILS where Donor_ID = ' + p1[i].Donor_ID + ';';
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.send([]);
                    }
                    else {
                        resolve(rows);
                    };
                });
            }));
            var list2 = [];
            for (var j = 0; j < Object.keys(p2).length; j++) {
                list2.push(p2[j].Email);
            }

            var p3 = await (new Promise(function (resolve, reject) {
                var str = 'select * from ProjectProDB.DONOR_PHONE_NUMBERS where Donor_ID = ' + p1[i].Donor_ID + ';';
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.send([]);
                    }
                    else {
                        resolve(rows);
                    };
                });
            }));
            var list3 = [];
            for (var j = 0; j < Object.keys(p3).length; j++) {
                list3.push(p3[j].Phone_number);
            }

            var p4 = await (new Promise(function (resolve, reject) {
                var str = 'select * from ProjectProDB.DONATIONS where Donor_ID = ' + p1[i].Donor_ID + ';';
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err)
                        res.send([]);
                    }
                    else {
                        resolve(rows);
                    };
                });
            }));
            var list4 = [];
            for (var j = 0; j < Object.keys(p4).length; j++) {
                list4.push({
                    Donation_ID: p4[j].Donation_ID,
                    Amount: p4[j].Amount,
                    Cause_ID: p4[j].Cause_ID
                });
            }

            list.push({
                Donor_ID: p1[i].Donor_ID,
                First_name: p1[i].First_name,
                Last_name: p1[i].Last_name,
                Mailing_address: p1[i].Mailing_address,
                Emails: list2,
                Phone_numbers: list3,
                Donations: list4
            });
        }
        res.send({ status: true, Donors: list });
        connection.end();
        console.log('connection closed in listDonors');
    }
    else {
        res.send({ status: false });
    }
});

/*
 * request
 *     { "id": 1,
"Donor_ID": 1,
"First_name": "Joseph",
"Last_name": "Stalin",
"Phone_numbers": ["3214433435", "231432897"],
"Emails": ["qoewiniwo@fdoianfo.saiodn", "sdasifnanw@ioan.sdin"]
}
 *
 * response
 * {
    "status": true
}
*/
app.post('/editDonor', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        var emailDuplicates = false;
        var allValidEmails = true;
        // ensure there are no duplicates in the new entries
        for (var i = 0; i < req.body.Emails.length; i++) {
            var hasDot = (req.body.Emails[i]).includes(".");
            var hasAt = (req.body.Emails[i]).includes("@");
            if (!(hasDot && hasAt)) {
                allValidEmails = false;
            }
            for (var j = i + 1; j < req.body.Emails.length; j++) {
                if ((req.body.Emails[i]) == (req.body.Emails[j])) {
                    emailDuplicates = true;
                };
            }
        }
        if (!emailDuplicates) {
            if (allValidEmails) {
                var phoneDuplicates = false;
                var allValidPhoneNumbers = true;
                // ensure there are no duplicates in the new entries
                for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                    for (var j = 0; j < (req.body.Phone_numbers[i]).length; j++) {
                        if (!((!isNaN(parseInt((req.body.Phone_numbers[i]).charAt(j), 10)))
                            || ((req.body.Phone_numbers[i]).charAt(j) == '-')
                            || ((req.body.Phone_numbers[i]).charAt(j) == '(')
                            || ((req.body.Phone_numbers[i]).charAt(j) == ')'))) {
                            allValidPhoneNumbers = false;
                        }
                    }
                    for (var j = i + 1; j < req.body.Phone_numbers.length; j++) {
                        if ((req.body.Phone_numbers[i]) == (req.body.Phone_numbers[j])) {
                            phoneDuplicates = true;
                        };
                    }
                }
                if (!phoneDuplicates) {
                    if (allValidPhoneNumbers) {
                        var connection = connectToDB();
                        var p1 = new Promise(function (resolve, reject) {
                            var str = `update ProjectProDB.DONORS 
                    set First_name = \'` + req.body.First_name + `\', Last_name = \'` + req.body.Last_name + `\'
                    where Donor_ID = ` + req.body.Donor_ID + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        });
                        var p2 = await (new Promise(function (resolve, reject) {
                            var str = `delete from ProjectProDB.DONOR_EMAILS 
                    where Donor_ID = ` + req.body.Donor_ID + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        }));
                        var p3 = new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Emails.length; i++) {
                                var str = `insert ProjectProDB.DONOR_EMAILS 
                                values (` + req.body.Donor_ID + ', \'' + req.body.Emails[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        });
                        var p4 = await (new Promise(function (resolve, reject) {
                            var str = `delete from ProjectProDB.DONOR_PHONE_NUMBERS 
                    where Donor_ID = ` + req.body.Donor_ID + ';';
                            connection.query(str, (err, rows) => {
                                if (err) {
                                    console.log(err);
                                    resolve(false);
                                }
                                else {
                                    resolve(true);
                                }
                            });
                        }));

                        var p5 = new Promise(function (resolve, reject) {
                            for (var i = 0; i < req.body.Phone_numbers.length; i++) {
                                var str = `insert ProjectProDB.DONOR_PHONE_NUMBERS
                                values (` + req.body.Donor_ID + ', \'' + req.body.Phone_numbers[i] + '\');';
                                connection.query(str, (err, rows) => {
                                    if (err) {
                                        console.log(err);
                                        resolve(false);
                                    };
                                });
                            };
                            resolve(true);
                        });
                        async function f(p1, p2, p3, p4, p5) {

                            let p1V = await p1;
                            let p2V = p2;
                            let p3V = await p3;
                            let p4V = p4;
                            let p5V = await p5;

                            res.send({ status: (p1V && p2V && p3V && p4V && p5V) });
                        }
                        f(p1, p2, p3, p4, p5);
                        connection.end();
                        console.log('connection closed');
                    }
                    else {
                        res.send({
                            status: false,
                            error_message: "Error: Invalid phone number(s) given"
                        });
                    }
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: Duplicate Phone numbers given"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Invalid Email(s) given"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Duplicate Emails given"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Donor_ID": 1
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/removeDonor', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var exists = await checkExists(req.body.Donor_ID, "DONORS", "Donor_ID");
        if (exists) {
            var connection = connectToDB();
            var p1 = await (new Promise(function (resolve, reject) {
                var str = `delete from ProjectProDB.DONORS where Donor_ID = ` + req.body.Donor_ID + `;`;
                connection.query(str, (err, rows) => {
                    if (err) {
                        console.log(err);
                        resolve(false);
                    }
                    else {
                        resolve(true);
                    }
                });
            }));
            res.send({ status: p1 });
            connection.end();
            console.log('connection closed in removeDonor');
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Donor does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});


/*
 * request  
 * { "id": 1,
"Amount": 30,
"Donor_ID": 1,
"Cause_ID": 1
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addDonation', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var donorExists = await checkExists(req.body.Donor_ID, "DONORS", "Donor_ID");
        if (donorExists) {
            var causeExists = await checkExists(req.body.Cause_ID, "CAUSES", "Cause_ID");
            if (causeExists) {
                var connection = connectToDB();
                var nextPrime = await getNextPrimary("DONATIONS", "Donation_ID");
                var p1 = await (new Promise(function (resolve, reject) {
                    var str = `insert into ProjectProDB.DONATIONS
                                values (` + nextPrime + `, ` + req.body.Cause_ID + `, ` + req.body.Donor_ID + `, ` + req.body.Amount + `);`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                res.send({ status: p1 });
                connection.end();
                console.log('connection closed in addDonation');
            } else {
                res.send({
                    status: false,
                    error_message: "Error: Cause does not exist"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Donor does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request  
 * { "id": 1,
"Donation_ID": 1,
"Amount": 20,
"Donor_ID": 1,
"Cause_ID": 1
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editDonation', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        if (await checkExists(req.body.Donation_ID, "DONATIONS", "Donation_ID")) {
            if (await checkExists(req.body.Cause_ID, "CAUSES", "Cause_ID")) {
                if ((await checkExists(req.body.Donor_ID, "DONORS", "Donor_ID"))) {
                    var connection = connectToDB();
                    var p1 = await (new Promise(function (resolve, reject) {
                        var str = `update ProjectProDB.Donations set Donor_ID = ` + req.body.Donor_ID + `, 
                            Cause_ID = ` + req.body.Cause_ID + `, 
                            Amount = ` + req.body.Amount + `
                            where Donation_ID = ` + req.body.Donation_ID + `;`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }));
                    res.send({ status: p1 });
                    connection.end();
                    console.log('connection closed in editDonation');
                } else {
                    res.send({
                        status: false,
                        error_message: "Error: Donor does not exists"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Cause does not exist"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Donations does not exist"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * 
 * request
 *      { "id": 1 }
 *
 * response
 {
    "status": true,
    "Donations": [
        {
            "Donation_ID": 1,
            "Amount": 20,
            "Cause_ID": 1,
            "Cause_name": "Helping the poor",
            "Cause_description": "Helping the poor",
            "Donor_ID": 1,
            "First_name": "Uncle",
            "Last_name": "Joe",
            "Mailing_address": "gulag144 Vostok ave Russia"
        }
    ]
}
 *
*/
app.post('/listDonations', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var p1 = await (new Promise(function (resolve, reject) {
            var str = `select c.*, d.*, dts.Amount, dts.Donation_ID
                            from (((ProjectProDB.DONATIONS as dts) join (ProjectProDB.DONORS as d) on dts.Donor_ID = d.Donor_ID)
                            join (ProjectProDB.CAUSES as C) on dts.Cause_ID = c.Cause_ID);`;
            connection.query(str, (err, rows) => {
                if (err) {
                    console.log(err);
                    resolve([]);
                }
                else {
                    resolve(rows);
                }
            });
        }));
        var list = []
        for (var i = 0; i < Object.keys(p1).length; i++) {
            list.push({
                Donation_ID: p1[i].Donation_ID,
                Amount: p1[i].Amount,
                Cause_ID: p1[i].Cause_ID,
                Cause_name: p1[i].Cause_name,
                Cause_description: p1[i].Cause_name,
                Donor_ID: p1[i].Donor_ID,
                First_name: p1[i].First_name,
                Last_name: p1[i].Last_name,
                Mailing_address: p1[i].Mailing_address
            })
        }
        var ret = { "status": true, Donations: list };
        connection.end();
        console.log('connection closed on listCauses');
        res.send(ret);
    }
    else {
        res.send({
            "status": false,
            "error_message": "Error: Invalid Permissions"
        });
    };
}); 


/*
 * request  
 * { "id": 1,
"Worker_ID": 1,
"Salary": 20,
"SSN": 987654321,
"Worker_type": "Employee"
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/editWorkerAsAdmin', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        if (req.body.Worker_type != undefined) {
            if (await checkExists(req.body.Worker_ID, "WORKERS", "Worker_ID")) {
                if (!(await checkExists(req.body.SSN, "WORKERS", "SSN"))) {
                    if ((req.body.Worker_type).toUpperCase() == "EMPLOYEE") {
                        var validSSN = true;
                        if (req.body.SSN.length != 9) {
                            validSSN = false
                        }
                        for (var j = 0; j < req.body.SSN.length; j++) {
                            if (!((!isNaN(parseInt((req.body.SSN).charAt(j), 10))))) {
                                validSSN = false;
                            }
                        }
                        if (!validSSN) {
                            return res.send({
                                status: false,
                                error_message: "Error: Invalid SSN given"
                            })
                        }
                    }
                    var connection = connectToDB();
                    var p1 = await (new Promise(function (resolve, reject) {
                        var str = "";
                        if ((req.body.Worker_type).toUpperCase() == "EMPLOYEE") {
                            str = `update ProjectProDB.WORKERS set SSN = ` + req.body.SSN + `, 
                            Salary = ` + req.body.Salary + `, 
                            Worker_type = \'` + req.body.Worker_type.toUpperCase() + `\'
                            where Worker_ID = ` + req.body.Worker_ID + `;`;
                        }
                        else {
                            str = `update ProjectProDB.WORKERS set SSN = null, 
                            Salary = 0, 
                            Worker_type = \'` + req.body.Worker_type.toUpperCase() + `\'
                            where Worker_ID = ` + req.body.Worker_ID + `;`;
                        }
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err);
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            }
                        });
                    }));
                    res.send({ status: p1 });
                    connection.end();
                    console.log('connection closed in editDonation');
                }
                else {
                    res.send({
                        status: false,
                        error_message: "Error: SSN already exists"
                    });
                }
            }
            else {
                res.send({
                    status: false,
                    error_message: "Error: Worker does not exist"
                });
            }
        }
        else {
            res.send({
                status: false,
                error_message: "Error: Worker Type was not given"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});

/*
 * request { "id": 1}
 *     
 *
 * response 
 * {
    "status": true,
    "Workers": [
        {
            "Worker_ID": 1,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Trent",
            "Last_name": "Johnston",
            "Worker_type": "Employee",
        },
        {
            "Worker_ID": 2,
            "Start_date": "2000-01-01T07:00:00.000Z",
            "First_name": "Arthur",
            "Last_name": "L",
            "Worker_type": "Employee"
        }
    ]
}
 * 
*/
app.post('/listWorkersAsAdmin', async function (req, res) {
    // check for permissions
    if (await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL)) {
        console.log('permission granted');
        // connect to db
        var connection = connectToDB();
        // q db
        var str = 'select * from ProjectProDB.WORKERS';
        connection.query(str, (err, rows) => {
            if (err) {
                console.log(err)
                res.send({ status: false });
            }
            else {
                var list = [];
                for (var i = 0; i < Object.keys(rows).length; i++) {
                    list.push({
                        Worker_ID: rows[i].Worker_ID,
                        Start_date: rows[i].Start_date,
                        First_name: rows[i].First_name,
                        Last_name: rows[i].Last_name,
                        Worker_type: rows[i].Worker_type,
                        SSN: rows[i].SSN,
                        Salary: rows[i].Salary
                    });
                }
                res.send({ status: true, Workers: list });
            };
        });
        connection.end();
        console.log('connection closed in allWorkersAsAdmin');
    }
    else {
        res.send({ status: false });
    }
});

/*
 * request  
 * { "id": 1,
"Team_name": "New Team",
"Supervisor_ID": 3
}
 * response 
 * {
    "status": true
}
 * 
*/
app.post('/addTeam', async function (req, res) {
    // check for permissions
    var permission = await verifyPermissions((req.body.id), ADMIN_PERMISSION_LEVEL);
    if (permission) {
        console.log('permission granted');
        var nextPrime = await getNextPrimary("TEAMS", "Team_ID");
        var nameUnique = await checkUnique(req.body.Team_name, "TEAMS", "Team_name");
        if (nameUnique) {
            if (await checkExists(req.body.Supervisor_ID, "TEAMS", "Supervisor_ID")) {
                res.send({
                    status: false,
                    error_message: "Error: Worker is already managing a team"
                });
            }
            else {
                var connection = connectToDB();
                var p0 = await (new Promise(function (resolve, reject) {
                    var str = `select aa.Access_level 
                        from (ProjectProDB.ACCOUNT_ACCESS as aa)
                        where Worker_ID = ` + req.body.Supervisor_ID + `;`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err)
                            resolve(false);
                        }
                        else if (rows[0].Access_level == 1) {
                            resolve(true);
                        }
                        else {
                            resolve(false);
                        }
                    });
                }));
                if (p0) {
                    var p0_1 = await (new Promise(function (resolve, reject) {
                        var str = `update ProjectProDB.ACCOUNT_ACCESS set Access_level = 2
                        where Worker_ID = ` + req.body.Supervisor_ID + `;`;
                        connection.query(str, (err, rows) => {
                            if (err) {
                                console.log(err)
                                resolve(false);
                            }
                            else {
                                resolve(true);
                            };
                        });
                    }));
                }
                var p1 = await (new Promise(function (resolve, reject) {
                    var str = `insert into ProjectProDB.TEAMS
                    values (` + nextPrime + `, ` + req.body.Supervisor_ID + `, \'` + req.body.Team_name + `\');`;
                    connection.query(str, (err, rows) => {
                        if (err) {
                            console.log(err);
                            resolve(false);
                        }
                        else {
                            resolve(true);
                        }
                    });
                }));
                res.send({ status: p1 });
                connection.end();
                console.log('connection closed in addTeam');
            }
        } else {
            res.send({
                status: false,
                error_message: "Error: Name already exists or is invalid"
            });
        }
    }
    else {
        res.send({
            status: false,
            error_message: "Error: Invalid Permissions"
        });
    }
});
