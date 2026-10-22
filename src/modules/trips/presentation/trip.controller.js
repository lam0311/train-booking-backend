class TripController {
  constructor(getTripsUseCase) {
    this.getTripsUseCase = getTripsUseCase;
  }

  getTrips = async (req, res, next) => {
    try {
      const { from, to, date } = req.validatedQuery;
      const result = await this.getTripsUseCase.execute({ from, to, date });
      return res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  };
}

module.exports = TripController;