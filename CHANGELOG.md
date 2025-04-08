# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [Unreleased]

### Added
- HTML validation for task creation and update: validate html_notes when API returns 400 errors
- HTML support for task comments: added html_text parameter to createTaskStory

### Changed
- Improved error handling for HTML content validation


## [1.7.0] - 2025-04-07

### Added
- Tag management: find tasks by tags and browse tags in workspaces
- Support for creating milestone/approval tasks in your projects
- Custom fields support when creating and updating tasks
- Enhanced subtask organization with ability to position subtasks in specific order
- Resources support: workspaces are now available as resources
- New task management prompts to help analyze task completeness and create tasks more effectively
- Ability to set parent tasks and position subtasks within a task hierarchy
- Project template resource: fetch projects by GID with sections and custom fields

### Changed
- Renamed filter keys to use underscores for better compatibility and clarity

## [1.6.0] - 2025-02-08

### Added

- Support for Project Status (#2)
- CHANGELOG.md

## [1.5.2] - 2025-01-24

### Changed

- Reduce the amount of tokens used by custom fields even more

## [1.5.1] - 2025-01-24

### Changed

- Reduce the amount of tokens used by custom fields

## [1.5.0] - 2025-01-23

### Added

- Ability to search tasks by custom fields

### Changed

- Specify the repo url in the package.json so it shows on npmjs.com
- Use standard format for bin location

[unreleased]: https://github.com/roychri/mcp-server-asana/compare/v1.7.0..HEAD
[1.7.0]: https://github.com/roychri/mcp-server-asana/compare/v1.6.0..v1.7.0
[1.6.0]: https://github.com/roychri/mcp-server-asana/compare/v1.5.2...v1.6.0
[1.5.2]: https://github.com/roychri/mcp-server-asana/compare/v1.5.1...v1.5.2
[1.5.1]: https://github.com/roychri/mcp-server-asana/compare/v1.5.0...v1.5.1
[1.5.0]: https://github.com/roychri/mcp-server-asana/compare/v1.4.0...v1.5.0
