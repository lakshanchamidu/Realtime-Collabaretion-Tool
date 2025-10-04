const Document = require('../models/Document');

exports.createDoc = async (req, res) => {
  try {
    const title = req.body?.title || 'Untitled';
    const doc = await Document.create({ title, owner: req.user.sub });
    return res.status(201).json(doc);
  } catch (e) {
    return res.status(500).json({ message: e.message });
  }
};

exports.listDocs = async (req, res) => {
  const uid = req.user.sub;
  const docs = await Document.find({
    $or: [{ owner: uid }, { editors: uid }, { viewers: uid }]
  }).sort({ updatedAt: -1 });
  return res.json(docs);
};

exports.getDoc = async (req, res) => {
  const uid = req.user.sub;
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });

  const allowed = [
    doc.owner?.toString(),
    ...doc.editors.map((e) => e.toString()),
    ...doc.viewers.map((v) => v.toString())
  ].includes(uid);
  if (!allowed) return res.status(403).json({ message: 'Forbidden' });

  return res.json(doc);
};

exports.updateDocMeta = async (req, res) => {
  const uid = req.user.sub;
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.owner.toString() !== uid)
    return res.status(403).json({ message: 'Only owner can update' });

  doc.title = req.body?.title ?? doc.title;
  await doc.save();
  return res.json(doc);
};

exports.deleteDoc = async (req, res) => {
  const uid = req.user.sub;
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.owner.toString() !== uid)
    return res.status(403).json({ message: 'Only owner can delete' });

  await doc.deleteOne();
  return res.status(204).send();
};

exports.shareDoc = async (req, res) => {
  const uid = req.user.sub;
  const { editorIds = [], viewerIds = [] } = req.body || {};
  const doc = await Document.findById(req.params.id);
  if (!doc) return res.status(404).json({ message: 'Not found' });
  if (doc.owner.toString() !== uid)
    return res.status(403).json({ message: 'Only owner can share' });

  const uniq = (arr) => Array.from(new Set(arr.map(String)));
  doc.editors = uniq([...(doc.editors || []), ...editorIds]);
  doc.viewers = uniq([...(doc.viewers || []), ...viewerIds]);

  await doc.save();
  return res.json(doc);
};