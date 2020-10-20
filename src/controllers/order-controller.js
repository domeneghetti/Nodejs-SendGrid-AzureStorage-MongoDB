'use strict';

const repository = require('../repositories/order-repository');
const guid = require('guid');
const authService = require('../services/auth-service');

exports.get = async () => {
    const res = await repository.find({});
    return res;
}

exports.post = async(req, res, next) => {
    try {
        var token = req.body.token || req.query.token || req.headers['x-access-token'];
        var data = await authService.decodeToken(token);

        await repository.create({
            customer: data.id,
            number: guid.raw().substring(0,6),
            items: req.body.items
        });
        res.status(201).send({
            message: 'Pedido cadastrado com sucesso'
        });
    }catch(e){
        res.status(500).send({
             message: 'Falha ao cadastrar Pedido', data: e
        });
    }
}