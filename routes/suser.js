var express = require('express');
var router = express.Router();
var suserdb = require('../database/sUser-db')
var objectId = require('mongodb').ObjectId
var qrcode = require('../public/javascripts/qrcode');
var mailotp = require('../connection/mail-sender');
var url = require('../connection/url')

function verifySecondaryUser(req, res, next) {
    if (req.session.suser) {
        next()
    }
    else {
        res.redirect('/suser/login')
    }
}

var soutotp =
{
    otp: null,
    email: null
}

router.get('/', function (req, res, next) {
    if (req.session.suser) {
        //console.log(req.session.suser);
        suserdb.Check_Is_anY_nOtification_Coming_Or_not(req.session.suser._id).then((notfy) => {
            if (notfy) {

                res.render('./susers/first-page', { suserhd: true, suser: req.session.suser, notfy })
            }
            else {
                res.render('./susers/first-page', { suserhd: true, suser: req.session.suser })
            }
        })
    }
    else {
        res.render('./susers/first-page', { suserhd: true })
    }
});
router.get('/signup', (req, res) => {
    if (req.session.suseremailexist) {
        res.render('./susers/signup-page', { existemail: "This mail address already existing" })
        req.session.suseremailexist = false
    }
    else {
        res.render('./susers/signup-page')
    }
})
router.post('/signup', (req, res) => {
    console.log(req.body);
    suserdb.ChecK_whethet_THE_Email_Already_Existing_or_Not(req.body.email).then(() => {
        req.session.suseremailexist = true
        res.redirect('/suser/signup')
    }).catch(() => {
        mailotp.mail_sender_api_Call(req.body.email).then((otp) => {
            console.log("opt success");
            req.body.creditpoints = 0;
            req.body.isotpcheck = false;
            req.body.otp = parseInt(otp);
            soutotp.otp = parseInt(otp);
            soutotp.email = req.body.email
            suserdb.Do_Secondary_user_signup(req.body).then((id) => {
                
                res.redirect('/suser/otppage')
            })
        })
    })
})
router.get('/otppage', (req, res) => {
    console.log(soutotp);
    res.render('./susers/otp-page',{url:url.localurl})
})
router.post('/otppage', (req, res) => {
    console.log("OOOOOO");
    console.log(soutotp);
    
    suserdb.Change_Otp_object(parseInt(req.body.one + req.body.two + req.body.three + req.body.four + req.body.five + req.body.six), soutotp.email).then(() => {
        res.redirect('/suser/login')
    }).catch(() => {
        res.render('./susers/otp-page', { otperrr: true })
    })
})
router.get('/login', (req, res) => {
    if (req.session.suser) {
        res.redirect('/suser')
    }
    else {
        if (req.session.sfailed) {

            res.render('./susers/login-page', { logerr: true })
            req.session.sfailed = false
        }
        else {
            res.render('./susers/login-page')
        }
    }

})
router.post('/login', (req, res) => {
    suserdb.Do_Secondary_User_Login(req.body).then((resc) => {

        req.session.suser = { ...resc };
        req.session.suser.status = true;
        res.redirect('/suser')
    }).catch(() => {
        req.session.sfailed = true;
        res.redirect('/suser/login')

    })
})
router.get('/logout', (req, res) => {
    req.session.suser = null;
    res.redirect('/suser/login')
})
router.get('/findbus', verifySecondaryUser, (req, res) => {
    res.render('./susers/search-bus', { suserhd: true, suser: req.session.suser })

})
router.post('/findbus', (req, res) => {
    req.body.from = req.body.from.toUpperCase()
    req.body.to = req.body.to.toUpperCase()
    console.log(req.body);
    suserdb.Find_Matching_Busess_Search_With_Placess(req.body).then((bus) => {
        console.log(bus.length);
        if (bus.length != 0) {
            res.render('./susers/search-bus', { suserhd: true, bus, suser: req.session.suser })
        }
        else {
            res.render('./susers/search-bus', { suserhd: true, suser: req.session.suser, err: "Bus Not Available" })
        }


    })
})
router.get('/busticket', (req, res) => {
    console.log(req.query.userid);
    suserdb.Get_Buse_info_Whe_User_Chose_a_BUS(req.query.id, req.query.userid).then((info) => {
        info.dateArray = JSON.stringify(info.dateArray);
        res.render('./susers/bus-info', { suserhd: true, info, suser: req.session.suser })
    })
})
router.post('/buspay', (req, res) => {
    req.body.suserid = objectId(req.session.suser._id);
    req.body.puser = objectId(req.body.puser)
    req.body.isvalidated = false;
    req.body.date = new Date()
    req.body.id = objectId(req.body.id);
    req.body.creditpointcounted = false;
   
    console.log(req.body);
    suserdb.Insert_Secndary_User_Payment_Details(req.body).then(async (id) => {

        await qrcode.GenerateOrder_Qr_Code(id).then((data) => {
            if (req.body.paymethod == "credit") {
                suserdb.Update_Pay_Status_For_Credit_pay(id).then(() => {
                    suserdb.Update_Credit_point_After_Payment(req.session.suser._id).then((currentcreditpoint) => {
                        var updatedpoint = currentcreditpoint - parseInt(req.body.total)
                        suserdb.Update_Credit_Points_When_GetTotal_And_Used(req.session.suser._id, parseInt(updatedpoint)).then(() => {
                            res.json(false)
                        })

                    })
                })
            }
            else {
                suserdb.generateRazorpay(id, req.body.total).then((response) => {
                    response.tkno = req.body.tkno;
                    response.busid = req.body.id
                    console.log(response);
                    res.json(response)
                })

            }

        })
    })
})
router.post('/verfy-pay', (req, res) => {
    console.log("findWork ID", req.body);
    suserdb.verify_Payment(req.body).then(() => {
        suserdb.Update_available_Seats_When_User_paceed_ticket(req.body['order[busid]'], parseInt(req.body['order[tkno]']), req.body['order[receipt]'])
        res.json({ status: true })
    }).catch(() => {
        res.json({ status: 'Payment Failed' })
    })
})
router.get('/viewtickets', verifySecondaryUser, (req, res) => {
    var dateobj = require('../extra/ticket-autodelete')
    suserdb.Show_Users_Purchased_Tickets(req.session.suser._id).then(async (tickets) => {
        // console.log(tickets);
        await tickets.map(async (i) => {
            if (i.isvalidated == true) {
                // console.log(i);
                // let predate = i.preferredDates;

                // let today = new Date();

                // // Convert to IST (Indian Standard Time)
                // let options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
                // let formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' for ISO 8601 format (YYYY-MM-DD)

                // let formattedToday = formatter.format(today);

                // console.log(formattedToday, predate);

                // if (predate < formattedToday) {


                //     await suserdb.Delete_Verified_Ticket_after_The_Verifyed_Day(i._id, i.suserid).then((resc) => { })
                // }
                console.log(i);
                const indices = dateobj.findIndicesByValue(i.Bus.stops, i.start, i.end);
                console.log(indices);


                const values = dateobj.findValuesBetweenIndices(i.Bus.dis, indices[0], indices[1] - 1);
                console.log("Tadaa", values);


                var countdate = dateobj.tocalculatetoataltimebusttraveled(values, i.Bus.speed)

                let today = new Date(i.preferredDates);
                console.log(today);

                function addDays(date, days) {
                    let result = new Date(date);
                    result.setDate(result.getDate() + days); // Add the specified number of days
                    return result;
                }

                // Convert a date to the desired format in IST (date only)
                function formatDateToIST(date) {
                    let options = {
                        timeZone: 'Asia/Kolkata',
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                    };

                    let formatter = new Intl.DateTimeFormat('en-CA', options);
                    return formatter.format(date);
                }
                let twoDaysLater = addDays(today, countdate - 1);
                let formattedTwoDaysLater = formatDateToIST(twoDaysLater);
                console.log(formattedTwoDaysLater);

                let todays = new Date();

                // Convert to IST (Indian Standard Time)
                let options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
                let formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' for ISO 8601 format (YYYY-MM-DD)

                let formattedToday = formatter.format(todays);
                if (formattedTwoDaysLater < formattedToday) {


                    await suserdb.Delete_Verified_Ticket_after_The_Verifyed_Day(i._id, i.suserid).then((resc) => { })
                }

            }
            else {
                let predate = i.preferredDates;
                let today = new Date();

                // Convert to IST (Indian Standard Time)
                let options = { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' };
                let formatter = new Intl.DateTimeFormat('en-CA', options); // 'en-CA' for ISO 8601 format (YYYY-MM-DD)

                let formattedToday = formatter.format(today);
                if (predate < formattedToday) {


                    await suserdb.UpDAte_EXPIRE_oBject(i._id, i.suserid).then((resc) => { })
                }

            }
        }
        )
        //console.log(tickets);
        res.render('./susers/view-tickets', { suserhd: true, suser: req.session.suser, tickets })
    })
})
router.get('/about', (req, res) => {
    res.render('./susers/about-page', { suserhd: true, suser: req.session.suser })
})
router.get('/clearexticket', verifySecondaryUser, (req, res) => {
    suserdb.Remove_Expired_Ticket(req.query.id).then(() => {
        res.redirect('/suser/viewtickets')
    })
})
router.post('/checkdate', (req, res) => {
    suserdb.Compair_Prefered_Date_Ticket_Availabilitys(req.body.id, req.body.date).then((count) => {
        res.json({ count })
    })
})
router.get('/notification', verifySecondaryUser, (req, res) => {
    suserdb.Update_Notfy_object_When_User_Viewed(req.session.suser._id).then(() => {

        suserdb.Get_Notification_InformationBy_Emergency(req.session.suser._id).then((notfinfo) => {
            console.log(notfinfo);
            res.render('./susers/notfication-page', { suserhd: true, suser: req.session.suser, info: notfinfo })
        })
    })
})
router.get('/getstarscore', (req, res) => {
    suserdb.TO_Get_How_Many_Credit_Score_User_HAVE(req.session.suser._id).then((stars) => {
        res.json({ stars: stars })
    })
})
router.get('/creditstar', verifySecondaryUser, (req, res) => {
    res.render('./susers/credit-star', { suserhd: true, suser: req.session.suser })
})
router.get('/getallstopsname', (req, res) => {
    suserdb.Get_all_Stopname_For_Simplefing_searcH().then((stops) => {

        var filterstops = stops.map(i => i.stops);
        const onearray = [...new Set(filterstops.flat().map(obj => Object.values(obj)).flat())]
        res.json({ stops: onearray })
    })
})
router.get('/activatecreditpay', (req, res) => {
    suserdb.Get_No_of_Creditpoints(req.session.suser._id).then((star) => {
        res.json(star)
    })
})
// router.get("/testdistance", verifySecondaryUser, (req, res) => {
//     var dateobj = require('../extra/ticket-autodelete')
//     suserdb.Show_Users_Purchased_Tickets(req.session.suser._id).then(async (tickets) => {
//         //console.log(tickets);
//         await tickets.map(async (i) => {
//             if (i.isvalidated == true) {


//             }
//         })
//     })
// })

module.exports = router;
