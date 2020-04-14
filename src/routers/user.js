const express = require('express')
const User = require('../models/user')
const router = express.Router()
const auth = require('../middleware/auth')
const multer = require('multer')
const sharp = require('sharp')
const {sendWelcomeMail, sendExitMail} = require('../emails/account')


router.post('/users/login', async (req, res) =>{
    try {
        const user = await User.findByCredentials(req.body.email, req.body.password)

        const token = await user.generateAuthToken()

        res.send({user, token})
    } catch (error) {
        res.status(400).send()   
    }
})

//CREATE A NEW USER
router.post('/users', async (req, res) => {
    
    const user = new User(req.body)
    
    try{
        await user.save()

        const token = await user.generateAuthToken()

        sendWelcomeMail(user.email, user.name)

        res.status(201).send({user, token})
    }catch(e){
        res.status(500).send(e)
    }

})

router.post('/users/logout', auth , async (req, res) =>{
    try{
        req.user.tokens = req.user.tokens.filter((token) =>{
            return token.token != req.token
        })
        await req.user.save()

        res.send()

    }catch(e){
        res.status(500).send()
    }
})

//Logout of all USERS

router.post('/users/logoutAll', auth, async (req, res)=>{
    try{
        req.user.tokens = []
        await req.user.save()

        res.send()

    }catch(e){
        res.status(500).send()
    }
})

//FIND USERS
router.get('/users/me', auth ,async (req, res)=>{
    res.send(req.user)
})

//Find user by id
//Access the dynamic value
/*
router.get('/users/:id', (req, res)=>{
    const _id = req.params.id
    
    console.log(_id);
    
    //Find by id - findById() , can also find by other obj by using findOne()

    User.findById(_id).then((user)=>{
        if(!user){
            return res.status(404).send()
        }
        res.send(user)
    }).catch((error)=>{
        res.status(500).send()
    }) 
})
*/

//Find user by email address
router.get('/users/:id', auth, async (req, res)=>{
    const email = req.params.id
    try{
        const user = await User.findOne({email})
        if(!user){ 
            return res.status(404).send()
        }
        res.send(user)
    }catch(err){
        res.status(500).send()
    }
})

//UPDATE USER BY ID
router.patch('/users/me', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['name', 'email', 'password', 'age']
    const isValidOperation = updates.every((update)=>allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send({error: 'Invalid operation'})
    }
    try{

        //const user = await User.findById(req.params.id)

        updates.forEach((update) => {
            req.user[update] = req.body[update]
        })

        await req.user.save()

       // const user = await User.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        res.send(req.user)

    }catch(err){
        res.status(400).send(err)
    }
})

//DELETE USER BY ID
router.delete('/users/me', auth,  async (req, res)=>{
    try{
       // const user = await User.findByIdAndDelete(req.user._id);
        // if(!user){
        //     return res.status(404).send()
        // }

        sendExitMail(req.user.email, req.user.name)

        await req.user.remove()
        res.send(req.user)
    }catch(err){
        res.status(500).send()
    }
})

const upload= multer({
    limits: {
        fileSize: 3000000
    },
    fileFilter(req, file, cb){

        if(!file.originalname.match(/\w\.(jpg|jpeg|png)/)){
            return cb(new Error('Please upload a image'))
        }
        
        cb(undefined, true)
    }
})

router.post('/users/me/avatar', auth, upload.single('avatar'), async (req, res) => {
    
    const buffer = await sharp(req.file.buffer).resize({width: 250, height: 250}).png().toBuffer() 
    
    req.user.avatar = buffer

    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.send({error: error.message})
})

router.delete('/users/me/avatar', auth,  async (req, res) => {
    req.user.avatar = undefined
    await req.user.save()
    res.send()
}, (error, req, res, next) => {
    res.send({error: error.message})
})

router.get('/users/:id/avatar',  async (req, res) =>{
    try {
        const user = await User.findById(req.params.id)

        if(!user || !user.avatar){
            throw new Error()
        }

        res.set('Content-Type', 'image/png')

        res.send(user.avatar)

    } catch (error) {
        res.status(404).send()
    }
})

module.exports = router