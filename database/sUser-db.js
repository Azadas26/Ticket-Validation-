const Promise = require('promise');
const bcrypt = require('bcryptjs');
const db = require('../connection/connect');
const consts = require('../connection/consts');
var objectId = require('mongodb').ObjectId;
var Razorpay = require('razorpay');
var instance = new Razorpay({
    key_id: 'rzp_test_NVSZaOyVAMHDJW',
    key_secret: '6A9u2YGlYT7tbBTdibTbL9bq',
});



module.exports =
{
    Do_Secondary_user_signup: (info) => {
        console.log(info);
        return new Promise(async (resolve, reject) => {
            info.password = await bcrypt.hash(info.password, 10);
            console.log(info);
            db.get().collection(consts.suserdb).insertOne(info).then((data) => {
                resolve(data.ops[0]._id)
            })
        })
    },
    Do_Secondary_User_Login: (info) => {
        return new Promise((resolve, reject) => {
            db.get().collection(consts.suserdb).findOne({ email: info.email }).then((data) => {
                if (data) {
                    bcrypt.compare(info.password, data.password).then((iscoorect) => {
                        if (iscoorect) {
                            resolve(data)
                        }
                        else {
                            console.log("Password Faild");
                            reject()
                        }
                    })
                }
                else {
                    console.log("Email Faild");
                    reject()
                }
            })
        })
    },
    Find_Matching_Busess_Search_With_Placess: (info) => {
        return new Promise(async (resolve, reject) => {
            var bus = await db.get().collection(consts.busdetails).aggregate([
                {
                    $match: {
                        $expr: {
                            $and: [
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: {
                                                        $reduce: {
                                                            input: "$stops",
                                                            initialValue: [],
                                                            in: { $concatArrays: ["$$value", { $objectToArray: "$$this" }] }
                                                        }
                                                    },
                                                    cond: { $eq: ["$$this.v", info.from] }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                },
                                {
                                    $gt: [
                                        {
                                            $size: {
                                                $filter: {
                                                    input: {
                                                        $reduce: {
                                                            input: "$stops",
                                                            initialValue: [],
                                                            in: { $concatArrays: ["$$value", { $objectToArray: "$$this" }] }
                                                        }
                                                    },
                                                    cond: { $eq: ["$$this.v", info.to] }
                                                }
                                            }
                                        },
                                        0
                                    ]
                                }
                            ]
                        }
                    }
                },
                {
                    $project: {
                        _id: 1,
                        bname: 1,
                        busnumber: 1,
                        stime: 1,
                        isreturn: 1,
                        retime: 1,
                        lino: 1,
                        max: 1,
                        price: 1,
                        numInputs: 1,
                        userId: 1,
                        isaccept: 1,
                        isbus: 1,
                        already: 1,
                        stops: 1
                    }
                }
            ]).toArray();
            //console.log(bus);

            resolve(bus)

        })
    },
    Get_Buse_info_Whe_User_Chose_a_BUS: (id, userid) => {
        return new Promise(async (resolve, reject) => {
            var businfo = await db.get().collection(consts.busdetails).aggregate([
                {
                    $match:
                    {
                        _id: objectId(id),
                        userId: objectId(userid)
                    }
                },
                {
                    $lookup: {
                        from: consts.userdb,
                        localField: "userId",
                        foreignField: "_id",
                        as: "User",
                    },
                },
                {
                    $project: {
                        _id: 1,
                        bname: 1,
                        busnumber: 1,
                        stime: 1,
                        isreturn: 1,
                        retime: 1,
                        lino: 1,
                        max: 1,
                        price: 1,
                        numInputs: 1,
                        userId: 1,
                        isaccept: 1,
                        isbus: 1,
                        already: 1,
                        stops: 1,
                        available: 1,
                        user:
                        {
                            $arrayElemAt: ["$User", 0],
                        }

                    },
                },
            ]).toArray()
            console.log(businfo);
            resolve(businfo)
        })
    },
    Insert_Secndary_User_Payment_Details: (info) => {
        return new Promise((resolve, reject) => {
            db.get().collection(consts.busorder).insertOne(info).then((resc) => {
                resolve(resc.ops[0]._id);
            })
        })
    },
    generateRazorpay: (orderId, total) => {
        return new Promise((resolve, reject) => {
            var options = {
                amount: total * 100,  // amount in the smallest currency unit
                currency: "INR",
                receipt: orderId
            };
            instance.orders.create(options, function (err, order) {
                if (err) {
                    console.log(err);
                }
                else {
                    //console.log(order);
                    resolve(order);
                }
            });
        })
    },
    verify_Payment: (details) => {
        return new Promise((resolve, reject) => {
            const crypto = require("crypto");
            const hmac = crypto.createHmac('sha256', '6A9u2YGlYT7tbBTdibTbL9bq');
            hmac.update(details['payment[razorpay_order_id]'] + "|" + details['payment[razorpay_payment_id]']);
            let generatedSignature = hmac.digest('hex');

            if (generatedSignature == details['payment[razorpay_signature]']) {
                console.log(" checked");
                resolve()
            }
            else {
                reject()
            }
        })
    },
    Update_available_Seats_When_User_paceed_ticket: (busid, tkno) => {
        return new Promise((resolve, reject) => {
            db.get().collection(consts.busdetails).findOne({_id:objectId(busid)}).then(async(data)=>
            {
                var availableis = data.available;
                await db.get().collection(consts.busdetails).updateOne({ _id: objectId(busid) },
                {
                    $set:
                    {
                        available: availableis - tkno
                    }
                }).then(()=>
                {
                    resolve()
                })
            })
        })
    }
}