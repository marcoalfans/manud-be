// src/controllers/umkm.controller.js
import httpStatus from 'http-status';
import * as umkmModel from '../models/umkm.model.js';

export const createUmkm = async (req, res) => {
  try {
    const data = await umkmModel.createUmkm(req.body);
    return res.status(httpStatus.CREATED).send({
      status: httpStatus.CREATED,
      message: 'UMKM created',
      data,
    });
  } catch (err) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: err.message,
    });
  }
};

export const updateUmkm = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error('Missing UMKM id');
    const data = await umkmModel.updateUmkm(id, req.body);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'UMKM updated',
      data,
    });
  } catch (err) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: err.message,
    });
  }
};

export const deleteUmkm = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id) throw new Error('Missing UMKM id');
    await umkmModel.deleteUmkm(id);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'UMKM deleted',
      id: Number(id),
    });
  } catch (err) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: err.message,
    });
  }
};

export const getAllUmkm = async (req, res) => {
  try {
    const { limit, cursor, sortBy, order, q, category } = req.query;
    const data = await umkmModel.listUmkm({ limit, cursor, sortBy, order, q, category });
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Get UMKM Success',
      ...data,
    });
  } catch (err) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: err.message,
    });
  }
};

export const getUmkmById = async (req, res) => {
  try {
    const id = req.params.id;
    const data = await umkmModel.getUmkmById(id);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Get UMKM Detail Success',
      data,
    });
  } catch (err) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: err.message,
    });
  }
};