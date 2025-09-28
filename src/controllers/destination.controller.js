import httpStatus from 'http-status';
import { destinationModel } from '../models/index.js';

// Jika endpoint "dataset" masih dibutuhkan, ubah untuk baca dari Firestore:
export const getDataset = async (req, res) => {
  try {
    const data = await destinationModel.browseDataset(req.query.d, req.query.r, req.query.c);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Get Destinations Success',
      data,
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};

// Detail destinasi dari Firestore (docId = param)
export const getDetailDataset = async (req, res) => {
  try {
    const data = await destinationModel.readDestinationById(req.params.dataId);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Get Detail Destination Success',
      data,
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};

export const getDestinations = async (req, res) => {
  try {
    const data = await destinationModel.readDataDestinations(req.id, req.query.d);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Get Destinations Success',
      data,
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};

export const saveDestinationToFavorite = async (req, res) => {
  try {
    const docId = await destinationModel.saveDestination(req.id, req.body.id);
    return res.status(httpStatus.CREATED).send({
      status: httpStatus.CREATED,
      message: 'Destination Saved Successfully',
      id: docId,
    });
  } catch (error) {
    return res.status(httpStatus.INTERNAL_SERVER_ERROR).send({
      status: httpStatus.INTERNAL_SERVER_ERROR,
      message: error.message || 'An error occurred while saving the destination',
    });
  }
};

export const deleteSavedDestination = async (req, res) => {
  try {
    await destinationModel.deleteDestination(req.id, String(req.body.id));
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Delete Destination Success',
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};

export const createDestination = async (req, res) => {
  try {
    const doc = await destinationModel.createDestination(req.id, req.body);
    return res.status(httpStatus.CREATED).send({
      status: httpStatus.CREATED,
      message: 'Destination Created',
      data: doc,
    });
  } catch (error) {
    return res.status(httpStatus.BAD_REQUEST).send({
      status: httpStatus.BAD_REQUEST,
      message: error.message,
    });
  }
};

export const updateDestination = async (req, res) => {
  try {
    const docId = req.params.id || req.body.id;
    if (!docId) throw new Error('Missing destination id');
    const doc = await destinationModel.updateDestination(docId, req.body);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Destination Updated',
      data: doc,
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};

export const deleteDestination = async (req, res) => {
  try {
    const docId = req.params.id || String(req.body.id);
    if (!docId) throw new Error('Missing destination id');
    await destinationModel.deleteDestinationById(docId);
    return res.status(httpStatus.OK).send({
      status: httpStatus.OK,
      message: 'Destination Deleted',
      id: docId,
    });
  } catch (error) {
    return res.status(httpStatus.NOT_FOUND).send({
      status: httpStatus.NOT_FOUND,
      message: error.message,
    });
  }
};