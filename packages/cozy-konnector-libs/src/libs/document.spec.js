const Document = require('./document')

class Simpson extends Document {}

describe("document", () => {
  let lisa = new Simpson({
    lastName: "Simpson",
    firstName: "Lisa",
    _id: "c7a76b7eb6c60ccd0c846604791940b1",
    _rev: "3-dca38838252c09fbb6b024e34dcc8b30"
  })

  it("should compute equality without _id, _rev", () => {
    // No difference
    const lisa2 = new Simpson({
      lastName: "Simpson",
      firstName: "Lisa"
    })
    const bart = new Simpson({
      lastName: "Simpson",
      firstName: "Bart"
    })
    expect(lisa.isEqual(lisa2)).toBe(true)
    expect(lisa.isEqual(bart)).toBe(false)
  });
});
