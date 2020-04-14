const express = require('express')
const Task = require('../models/task')
const auth = require('../middleware/auth')
const router = express.Router()

//Create a new task
router.post('/tasks', auth, async(req, res) =>{
    // const task = new Task(req.body)

    const task = new Task({
        ...req.body,
        owner: req.user._id
    })

    try {
        task.save()
        res.status(201).send(task)
    } catch (error) {
        res.status(500).send
    }
})

//GET /tasks?completed=true
//Limit, Skip 
//SortBy - Created At ASC/DESC
//Read all tasks
router.get('/tasks', auth, async(req, res)=>{

    const match = {}

    const sort = {}

    if(req.query.completed){
        match.completed = req.query.completed === 'true'
    }

    if(req.query.sortBy){
        //split into two parts

        const parts = req.query.sortBy.split(':')
        sort[parts[0]] = parts[1] === 'desc'? -1 : 1
    }

    try{
        //const tasks = await Task.find({owner: req.user._id})
        await req.user.populate({
            path: 'tasks',
            match,
            options:{
                limit: parseInt(req.query.limit),
                skip: parseInt(req.query.skip),
                sort
            }
        }).execPopulate()
        res.send(req.user.tasks)
    }catch(err){
        res.status(500).send()
    }
})

//Read single task by completed or not
router.get('/tasks/:id', auth, async(req, res)=>{
    const _id = req.params.id

    try{

        const task = await Task.findOne({ _id, owner: req.user._id})

        if(!task){
            res.status(404).send()
        }

        res.send(task)

    }catch(err){
        res.status(500).send()
    }
})

//Update a task by ID
router.patch('/tasks/:id', auth, async (req, res)=>{
    const updates = Object.keys(req.body)
    const allowedUpdates = ['description', 'completed']
    const isValidOperation = updates.every(update => allowedUpdates.includes(update))

    if(!isValidOperation){
        return res.status(400).send('Invalid operation')
    }

    try{

        // const task = await Task.findById(req.params.id)

        const task = await Task.findOne({_id: req.params.id, owner: req.user._id})

        //const task = await Task.findByIdAndUpdate(req.params.id, req.body, {new: true, runValidators: true})
        if(!task){
            return res.status(400).send()
        }

        updates.forEach((update)=> task[update] = req.body[update])

        await task.save()

        res.send(task)

    }catch(err){
        res.status(400).send()
    }

})

//Delete a task 
router.delete('/tasks/:id/', auth, async (req, res)=>{
    try{
        const task = await Task.findOneAndDelete({_id: req.params.id, owner: req.user._id})
        if(!task){
            return res.status(404).send()
        }
        res.send(task)
    }catch(err){
        res.status(500).send()
    }
})

module.exports = router