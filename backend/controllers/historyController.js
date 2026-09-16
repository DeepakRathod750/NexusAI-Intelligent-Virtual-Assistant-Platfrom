const History = require('../models/History');

exports.getAllHistory = async (req, res) => {
  try {
    const history = await History.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch history',
      error: error.message
    });
  }
};

exports.getHistoryByType = async (req, res) => {
  try {
    const { type } = req.params;
    const history = await History.find({ 
      user: req.user.id,
      type: type 
    })
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: `Failed to fetch ${req.params.type} history`,
      error: error.message
    });
  }
};
