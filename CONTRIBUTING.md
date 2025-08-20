# Contributing to mcp-gitlab-glab

Thank you for your interest in contributing to mcp-gitlab-glab! This document provides guidelines and information for contributors.

## Development Setup

1. **Fork and clone the repository**
   ```bash
   git clone https://github.com/weirdscience/mcp-gitlab.git
   cd mcp-gitlab
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm run check
   ```

## Development Workflow

### Code Style

- Use TypeScript for all new code
- Follow the existing code style and patterns
- Run linting before committing: `npm run lint`
- Format code: `npm run format`

### Testing

- Add tests for new features
- Ensure all tests pass: `npm run check`
- Test with different GitLab instances when possible

### Git Workflow

1. Create a feature branch from `main`
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes and commit them
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

3. Push your branch and create a pull request
   ```bash
   git push origin feature/your-feature-name
   ```

## Commit Message Format

Use conventional commit messages:

- `feat:` for new features
- `fix:` for bug fixes
- `docs:` for documentation changes
- `style:` for formatting changes
- `refactor:` for code refactoring
- `test:` for adding tests
- `chore:` for maintenance tasks

## Pull Request Guidelines

1. **Title**: Use a clear, descriptive title
2. **Description**: Explain what the PR does and why
3. **Tests**: Ensure all tests pass
4. **Documentation**: Update README.md if needed
5. **Screenshots**: Include screenshots for UI changes (if applicable)

## Reporting Issues

When reporting issues, please include:

- Operating system and version
- Node.js version
- glab CLI version
- GitLab instance type (gitlab.com or self-hosted)
- Steps to reproduce
- Expected vs actual behavior
- Error messages (if any)

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## License

By contributing to this project, you agree that your contributions will be licensed under the MIT License.
