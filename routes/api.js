const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const odoo_xmlrpc = require("odoo-xmlrpc");

//secret key
const secret_key = 'nour';

router.get('/', (req, res)=> {
    res.send({
        message: 'well done'
        
    });
});

router.post('/login', (req, res) => {
   
    //MOCK user
    const auth = {
        url: 'http://34.94.160.246',
        port: 8060,
        db: 'doc',
        username: req.body.username,
        password: req.body.password
    };

    const odoo = new odoo_xmlrpc(auth);
    odoo.connect((err, result) => {
        if(err) {
            res.sendStatus(403);
        }
        let user = {}
        if (req.body.type == 2) {
            odoo.execute_kw('res.partner', 'search_read', [[[['user_id.id','=', result],['is_patient', '=', true]],['id']]], function (err, value) {
                if (err) { 
                    return res.send(err); 
                }
                
                if (value.length != 0) {
                    user.id = value[0].id;
                    jwt.sign({auth}, secret_key, (err, token) => {
                        res.json({
                            token,
                            user
                        });
                    });
                } else {
                    result = {"code": 400, "message": "failed", 'data': [], "errors": ["username or password is incorrect."]}
                    res.status(400).send(result)
                }
                
                });
        } else {
            odoo.execute_kw('res.partner', 'search_read', [[[['user_id.id','=', result],['is_doctor', '=', true]],['id']]], function (err, value) {
                if (err) { 
                    return res.send(err); 
                }
                if (value.length != 0) {
                    user.id = value[0].id;
                    jwt.sign({auth}, secret_key, (err, token) => {
                        res.json({
                            token,
                            user
                        });
                    });
                } else {
                    result = {"code": 400, "message": "failed", 'data': [], "errors": ["username or password is incorrect."]}
                    res.status(400).send(result)
                }
                
                });

        }
         
        

        

    });

  

});

router.post('/call_method/:modelname/:method', verifyToken, (req, res)=> {

    const modelname = req.params.modelname;
    const method = req.params.method;
    const list = req.body.paramlist;
    const resultList = Object.values(list);
    
    console.log(resultList, 'lists');
    jwt.verify(req.token, secret_key, (err, authData) => {
        
        if(err) {
            res.sendStatus(403);
        } else {
            delete authData.auth.id;
            const odoo = new odoo_xmlrpc(authData.auth);

            odoo.connect((err, response) => {
                if(err) return console.log('error', err);
              
                odoo.execute_kw(modelname, method, [resultList], function (err, value) {
                    if (err) { return res.status(400).send(err); }
                    res.json({
                        data: value
                    });
                
                });
            });
        }

    });
});

router.post('/users/:modelname/:method', (req, res)=> {

    const modelname = req.params.modelname;
    const method = req.params.method;
    const list = req.body.paramlist;
    const resultList = Object.values(list);
    // const odoo = new odoo_xmlrpc(auth);
    var odoo = new odoo_xmlrpc({
        url: "http://34.94.160.246",
        port: 8060,
        db: 'doc',
        username: 'admin',
        password: 'admin'
      });

      
      
      odoo.connect(function (err, val) {
        if (err) { return console.log(err); }
        console.log(val);
    
        odoo.execute_kw(modelname, method, [resultList], function (err, value) {
          if (err) { return res.status(400).send(err); }
          res.json(value)
    
          console.log(value)
        });
      });
    });






//FORMAT OF TOKEN
//Authrization: Bearer <access_token>

//Verify Token
function verifyToken(req, res, next) {
    //Get auth header
    const bearerHeader = req.headers['authorization'];

    //Check if bearerToken is undefined
    if(typeof bearerHeader !== 'undefined') {
        //split the space
        const bearer = bearerHeader.split(' ');

        //Get Token From Array
        const bearerToken = bearer[1];
       
        //Set The Token
        req.token = bearerToken;

        //Next Middleware
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = router;
