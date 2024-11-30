# Contributing to Temporal Patterns

Thank you for contributing to **temporal-patterns-typescript**! This repository is designed to demonstrate patterns using Temporal workflows, and contributions that expand pattern coverage or improve existing examples are highly valued.

---

## Folder and File Structure

The project is organized with the following structure:

```
patterns/
  <pattern-name>/
    index.test.ts      # Main test file for the pattern
    src/
      attributes.ts    # Attribute definitions for the pattern
      workflows.ts     # Workflow definitions for the pattern
```

## Key Guidelines

1. Each pattern resides in its own directory under `patterns/`.
2. Add or update tests in the `index.test.ts` file within the relevant pattern's directory.
3. Workflow and attribute definitions belong in the `src/` folder under the appropriate pattern directory.

## Writing Tests

1. **Refer to Existing Tests**: Check the `index.test.ts` files in other patterns for examples of file organization and coding style.
2. **Create or Update Tests**:
   - Place new tests in the `index.test.ts` file for the relevant pattern.
   - Use the same structure and naming conventions as existing tests.
3. **Run Tests Locally**: Ensure your tests pass before submitting:
   ```bash
   npm test
   ```

---

## Submitting Your Contribution

1. **Fork the Repository**: Create a personal copy of the repo in your GitHub account.
2. **Create a Branch**: Use a descriptive name for your branch:
   ```bash
   git checkout -b add-new-pattern
   ```
3. **Commit Your Changes**: Use clear and descriptive commit messages:
   ```bash
   git commit -m "Add tests for <pattern-name>"
   ```
4. **Push Your Changes**:
   ```bash
   git push origin add-new-pattern
   ```
5. **Open a Pull Request**: Submit your changes for review via GitHub's Pull Request feature.

---

## Additional Notes

- Follow the coding style of existing files to maintain consistency.
- Thank you for helping us make this project better!
