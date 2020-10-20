'use strict';

const ValidationContract = require('../validators/fluent-validator');
const repository = require('../repositories/product-repository');

const azure = require('azure-storage');
const config = require('../config');
const guid = require('guid');

exports.get = async (req, res, next) => {
    try {
        var data = await repository.get();
        res.status(200).send(data);    
    } catch(e) {
        res.status(500).send({ message: 'Falha ao obter o produto', data: e });
    }
    
    //Exemplo usando promisses:

    // repository
    // .get()
    // .then(data => {
    //     res.status(200).send(data);
    // }).catch(e => {
    //     res.status(400).send({ message: 'Falha ao obter o produto', data: e });
    // });
}

exports.getBySlug = async (req, res, next) => {
    try {
        var data = await repository.getBySlug(req.params.slug);
        res.status(200).send(data);    
    } catch(e) {
        res.status(500).send({ message: 'Falha ao obter o produto', data: e });
    }
}

exports.getByID = async (req, res, next) => {
    try {
        var data = await repository.getById(req.params.id)
        res.status(200).send(data);
    } catch(e) {
        res.status(500).send({ message: 'Falha ao obter o produto', data: e });
    }
}

exports.getByTag = async (req, res, next) => {
    try {
        var data = await repository.getByTag(req.params.tag);
        res.status(200).send(data);
    } catch(e) {
        res.status(500).send({ message: 'Falha ao obter o produto', data: e });
    }
}

exports.post = async (req, res, next) => {
    let contract = new ValidationContract();
    contract.hasMinLen(req.body.title, 3, 'O título deve conter pelo menos 3 caracteres');
    contract.hasMinLen(req.body.slug, 3, 'O Slug deve conter pelo menos 3 caracteres');
    contract.hasMinLen(req.body.description, 3, 'A descrição deve conter pelo menos 3 caracteres');

    if(!contract.isValid()){
        res.status(400).send(contract.errors()).end();
        return;
    }

    try {
        //Criar o Blob Service
        const blobSvc = azure.createBlobService(config.containerConnectionString);

        let filename = guid.raw().toString() + '.jpg';
        let rawdata = req.body.image;
        let matches = rawdata.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        let type = matches[1];
        let buffer = new Buffer(matches[2], 'base64');

        //Salvar Imagem
        await blobSvc.createBlockBlobFromText('produc-images', filename, buffer, {
            contentType: type
        }, function(error, result, response) {
            if(error) {
                filename = 'default-product.png'
            }
        });
    
        await repository.create({
            title: req.body.title,
            slug: req.body.slug,
            description: req.body.description,
            price: req.body.price,
            active: true,
            tags: req.body.tags,
            image: 'https://cursonodejs.blob.core.windows.net/produc-images/' + filename
        })
        res.status(201).send({ message: 'Produto cadastrado com Sucesso!' });
    } catch(e) {
        console.log(e);
        res.status(500).send({ message: 'Falha ao cadastrar o Produto', data: e.toString() });
    }    
};

exports.put = (req, res, next) => {
    repository
    .update(req.params.id, req.body)
    . then(x => {
        res.status(200).send({ message: 'Produto atualizado com Sucesso!'});
    }). catch(e => {
        res.status(400).send({ message: 'Falha ao atualizar o Produto', data: e});
    });
};

exports.delete = (req, res, next) => {
    repository
    .delete(req.params.id)
    . then(x => {
        res.status(200).send({ message: 'Produto Excluido com Sucesso!'});
    }). catch(e => {
        res.status(400).send({ message: 'Falha ao Excluir o Produto', data: e});
    });
};
