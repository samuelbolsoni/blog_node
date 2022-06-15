const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const slugify = require('slugify');

require("../models/Categoria")
require("../models/Postagem")
const Categoria = mongoose.model("categorias")
const Postagem = mongoose.model("postagens")

const {isAdmin} = require("../helpers/isadmin")

// Config your options
const options = {
    replacement: '-', // replace spaces with replacement character, defaults to `-`
    remove: undefined, // remove characters that match regex, defaults to `undefined`
    lower: true, // convert to lower case, defaults to `false`
    strict: true, // strip special characters except replacement, defaults to `false`
    locale: 'en', // language code of the locale to use
  };

// Rotas
router.get('/',(req, res) => {
    res.render("admin/index")
})

router.get('/categorias', isAdmin, (req, res) => {
    Categoria
        .find()
        .sort({date: "desc"})
        .then((categorias) => {
            res.render("admin/categorias", { categorias: categorias})
        })
        .catch((erro) => {
            req.flash("error_msg", "Erro ao listar categorias")
            res.redirect("/admin")
    })
})

router.get('/categorias/add', isAdmin, (req, res) => {
    res.render("admin/addcategorias")
})

router.post('/categorias/nova', isAdmin, (req,res) => {

    var erros = [];

    if (!req.body.nome || typeof req.body.nome == undefined || req.body.nome == null) {
        erros.push({
            texto: "Nome inválido"
        })
    }

    if (erros.length > 0) {
        res.render("admin/addcategorias", {erros: erros})
    } else {
        var slugTitle = slugify(req.body.nome, options);
        const nova_categoria = {
            nome: req.body.nome,
            slug: slugTitle
        }
    
        new Categoria(nova_categoria)
            .save()
            .then(() => {
                req.flash("success_msg", "Categoria criada com sucesso")
                res.redirect("/admin/categorias")
            })
            .catch((erro) => {
                req.flash("error_msg", "Erro ao salvar categoria")
                res.redirect("/admin")
            })
    }
})

router.get("/categorias/edit/:id", isAdmin, (req, res) => {
    Categoria
        .findOne({_id: req.params.id})
        .then((categoria) => {
            res.render("admin/editcategorias", {categoria: categoria})
        })
        .catch((erro) => {
            req.flash("error_msg", "Esta categoria não existe")
            res.redirect("/admin/categorias")
        })  
})

router.post("/categorias/edit", isAdmin, (req, res) => {

    var slugTitle = slugify(req.body.nome, options);

    Categoria
        .findOne({_id: req.body.id})
        .then((categoria) => {
            categoria.nome = req.body.nome
            categoria.slug = slugTitle

            categoria
                .save()
                .then(() => {
                    req.flash("success_msg", "Categoria editada com sucesso")
                    res.redirect("/admin/categorias")
                })
                .catch((erro) => {
                    req.flash("error_msg", "Erro ao salvar categoria " + erro)
                    res.redirect("/admin/categorias")
                })
        })
        .catch((erro) => {
            req.flash("error_msg", "Erro ao editar categoria " + erro)
            res.redirect("/admin/categorias")
        })
})

router.post("/categorias/deletar", isAdmin, (req, res) => {
    Categoria
        .remove( {_id: req.body.id })
        .then(() => {
            req.flash("success_msg", "Categoria deletada com sucesso")
            res.redirect("/admin/categorias")
        })
        .catch((erro) => {
            req.flash("error_msg", "Houve um erro ao deletar registro")
            res.redirect("/admin/categorias")
        })
})

router.get('/postagens', isAdmin, (req, res) => {
   
    Postagem
        .find()
        .populate("categoria")
        .sort({data: "desc"})
        .then((postagens) => {
            res.render("admin/postagens", { postagens: postagens})
        }).catch((erro) => {
            res.send("Catch" + erro)
        })
    })

router.get("/postagens/add", isAdmin, (req, res) => {
    Categoria
        .find()
        .then((categorias) => {
            res.render("admin/addpostagem", {categorias: categorias})
        })
        .catch((erro) => {
            req.flash("error_msg", "Houve um erro ao salvar postagem " + erro)
            res.redirect("/admin/postagens")
        })
})

router.post('/postagens/nova', isAdmin, (req,res) => {

    var erros = [];

    if (req.body.categoria == 0) {
        erros.push({
            texto: "Categoria não informada"
        })
    }

    if (erros.length > 0) {
        res.render("admin/addpostagens", {erros: erros})
    } else {

        const nova_postagem = {
            titulo: req.body.titulo,
            slug: slugify(req.body.titulo, options),
            descricao: req.body.descricao,
            conteudo: req.body.conteudo,
            categoria: req.body.categoria
        }
    
        new Postagem(nova_postagem)
            .save()
            .then(() => {
                req.flash("success_msg", "Postagem criada com sucesso")
                res.redirect("/admin/postagens")
            })
            .catch((erro) => {
                req.flash("error_msg", "Erro ao salvar postagem")
                res.redirect("/admin")
            })
    }
})

router.get("/postagens/edit/:id", isAdmin,(req, res) => {
    
    Postagem
        .findOne({_id: req.params.id})
        .then((postagem) => {
            Categoria
                .find()
                .then((categorias) => {
                    console.log(postagem);
                    res.render("admin/editpostagens", {postagem: postagem, categorias: categorias})
                })
        })
        .catch((erro) => {
            req.flash("error_msg", "Esta postagem não existe")
            res.redirect("/admin/postagens")
        })
})

router.post("/postagens/edit", isAdmin, (req, res) => {

    Postagem
        .findOne({_id: req.body.id})
        .then((postagem) => {
            postagem.titulo = req.body.titulo
            postagem.slug = slugify(req.body.titulo, options)
            postagem.descricao = req.body.descricao
            postagem.conteudo = req.body.conteudo
            postagem.categoria = req.body.categoria

            postagem
                .save()
                .then(() => {
                    req.flash("success_msg", "Postagem editada com sucesso")
                    res.redirect("/admin/postagens")
                })
                .catch((erro) => {
                    req.flash("error_msg", "Erro ao salvar postagem " + erro)
                    res.redirect("/admin/postagens")
                })
        })
        .catch((erro) => {
            req.flash("error_msg", "Erro ao editar postagem " + erro)
            res.redirect("/admin/categorias")
        })
})

router.get("/postagens/deletar/:id", isAdmin, (req, res) => {
    Postagem
        .remove( {_id: req.params.id })
        .then(() => {
            req.flash("success_msg", "Postagem deletada com sucesso")
            res.redirect("/admin/postagens")
        })
        .catch((erro) => {
            req.flash("error_msg", "Houve um erro ao deletar registro")
            res.redirect("/admin/postagens")
        })
})

module.exports = router