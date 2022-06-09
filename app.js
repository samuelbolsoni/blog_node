//Carregando modulos
const express = require('express')
const { engine } = require('express-handlebars')
const bodyParser = require('body-parser')
const app = express()

const path = require('path')
const mongoose  = require('mongoose')
const res = require('express/lib/response')
const session = require('express-session')
const flash = require('connect-flash')

require("./models/Categoria")
const Categoria = mongoose.model("categorias")

require("./models/Postagem")
const Postagem = mongoose.model("postagens")

require("./models/Usuario")
const Usuario = mongoose.model("usuarios")

const usuarios = require('./routes/usuario')
const admin = require('./routes/admin')

const passport = require("passport")
require("./config/auth")(passport)

// Configurações
    //Session
    app.use(session({
        secret: "cursodenode",
        resave: true,
        saveUninitialized: true
    }))

    app.use(passport.initialize())
    app.use(passport.session())

    app.use(flash())

    //Body Parser
    app.use(bodyParser.urlencoded({extended: true}))
    app.use(bodyParser.json())

    //HandleBars
    app.engine('handlebars', engine({
        defaultLayout: 'main',
        runtimeOptions: {
            allowProtoPropertiesByDefault: true,
            allowProtoMethodsByDefault: true,
        },
    }));

    app.set('view engine', 'handlebars')

    //Middleware
    app.use((req,res, next) => {
        res.locals.success_msg = req.flash("success_msg")
        res.locals.error_msg = req.flash("error_msg")
        res.locals.error = req.flash("error")
        res.locals.user = req.user || null
        next()
    })

    //Mongoose
    mongoose.Promise = global.Promise

    mongoose.connect("mongodb://localhost/blogapp").then(() => {
        console.log("Conectado ao MongoDB")
    }).catch((erro) => {
        console.log("Erro ao conectar no mongoDB " + erro)
    })
    //Public
    app.use(express.static(path.join(__dirname, "public")))

    //Rotas
    app.get('/', (req, res) => {
        Postagem
            .find()
            .populate("categoria")
            .then((postagens) =>{
                res.render("index", {postagens: postagens})
            })
            .catch((erro) => {
                req.flash("error_msg", "Erro ao listar postagens")
            })
    })

    app.get("/postagens/:slug", (req, res) => {
        Postagem
            .findOne({"slug": req.params.slug})
            .then((postagem) => {
                if (postagem) {
                    res.render("postagem/index", {postagem: postagem})
                } else {
                    req.flash("error_msg", "Esta postagem não existe")
                    res.redirect("/")
                }
            }).catch((erro) => {
                req.flash("error_msg", "Erro ao retornar postagens")
                res.redirect("/")
            })
    })

    app.get("/categorias", (req, res) => {
        Categoria
        .find()
        .then((categorias) => {
            res.render("categorias/index", {categorias: categorias})

        }).catch((erro) => {
            req.flash("error_msg", "Erro ao retornar categorias")
            res.redirect("/")
        })
    })

    app.get("/categorias/:slug", (req, res) => {
        Categoria
            .findOne({slug: req.params.slug})
            .then((categoria) => {
                if (categoria) {
                    Postagem
                        .find({categoria: categoria._id})
                        .then((postagens) => {
                            res.render("categorias/postagens", {postagens: postagens, categoria: categoria})
                        })
                        .catch((erro) => {

                        })
                } else {
                    req.flash("error_msg", "Esta categoria não existe")
                    res.redirect("/")
                }
            }).catch((erro) => {
                req.flash("error_msg", "Erro ao retornar postagens " + erro)
                res.redirect("/")
            })
    })

    app.get("/404", (req, res) => {
        res.send("erro 404")
    })

    app.use('/admin', admin)
    app.use('/usuarios', usuarios)

//Outros
const PORT = 8081

app.listen(PORT, () => {
    console.log("Servidor rodando")
})