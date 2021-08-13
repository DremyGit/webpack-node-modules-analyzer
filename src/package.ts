import { Module, DependencyMap, PackageSizeInfo, FileSizeInfo } from './types';

const packageNameRegex = /\/node_modules\/((?:@[^/]+?\/)?[^/]+?)\//;
const buildInModuleRegex = /^\(webpack\)\//;
const externalModuleRegex = /^external /;
const ignoredModuleRegex = / \(ignored\)$/;

export class Package {
  public name: string;
  public dependencies?: Package[];
  public files: Module[];
  private entry: Module;

  private _size?: number;
  public get size(): number {
    if (this._size) {
      return this._size;
    }
    this._size = this.files.reduce((sum, { size }) => sum + size, 0);
    return this._size;
  }

  private _totalSize?: number;
  public get totalSize(): number {
    if (this._totalSize) {
      return this._totalSize;
    }
    if (!this.dependencies) {
      return this.size;
    }
    this._totalSize =
      this.size +
      this.dependencies.reduce((sum, { totalSize }) => sum + totalSize, 0);
    return this._totalSize;
  }

  constructor(entry: Module, name?: string) {
    this.entry = entry;
    if (name) {
      this.name = name;
    } else {
      const nameMatch = this.entry.name.match(packageNameRegex);
      if (!nameMatch) {
        throw new Error(`${this.entry.name} is not from a npm module`);
      }
      this.name = nameMatch[1];
    }
    this.files = [entry];
  }

  analyzeDependencies(
    dependencyMap: DependencyMap,
    excludes: Module[]
  ): Package {
    this.analyzeModuleDependencies(dependencyMap, this.entry, excludes);
    this.sort();
    return this;
  }

  private analyzeModuleDependencies(
    dependencyMap: DependencyMap,
    module: Module,
    excludes: Module[]
  ): Package {
    const dependencies = dependencyMap[module.name];
    if (!dependencies) {
      return this;
    }

    dependencies
      .filter(
        (dependency) =>
          !externalModuleRegex.test(dependency.name) &&
          !buildInModuleRegex.test(dependency.name) &&
          !ignoredModuleRegex.test(dependency.name) &&
          excludes.findIndex(({ name }) => name === dependency.name) === -1
      )
      .forEach((dependency, index, filtedDependency) => {
        if (this.isSamePackage(dependency)) {
          this.addModule(dependency);
          this.analyzeModuleDependencies(
            dependencyMap,
            dependency,
            excludes.concat(filtedDependency)
          );
        } else {
          const pack = this.getPackage(dependency);
          if (pack) {
            pack.analyzeDependencies(
              dependencyMap,
              excludes.concat(filtedDependency)
            );
            this.addDependency(pack);
          }
        }
      });

    return this;
  }

  private sort(): void {
    this.files.sort((a, b) => b.size - a.size);
    if (this.dependencies) {
      this.dependencies.sort((a, b) => b.totalSize - a.totalSize);
    }
  }

  private isSamePackage(module: Module, name = this.name): boolean {
    const nameMatch = module.name.match(packageNameRegex);
    return nameMatch ? nameMatch[1] === name : false;
  }

  private getPackage(module: Module): Package | null {
    const nameMatch = module.name.match(packageNameRegex);
    if (!nameMatch) {
      console.warn(`${module.name} is not from a npm module`);
      return null;
    }
    if (!this.dependencies) {
      return new Package(module, nameMatch[1]);
    }
    return (
      this.dependencies.find(({ name }) => name === module.name) ||
      new Package(module, nameMatch[1])
    );
  }

  private addModule(module: Module): void {
    if (this.files.findIndex(({ name }) => name === module.name) === -1) {
      this.files.push(module);
      delete this._size;
      delete this._totalSize;
    }
  }

  private addDependency(pack: Package): void {
    if (!this.dependencies) {
      this.dependencies = [];
    }
    if (this.dependencies.findIndex(({ name }) => name === pack.name) === -1) {
      this.dependencies.push(pack);
      delete this._totalSize;
    }
  }

  valueOf(): Record<string, unknown> {
    return {
      name: this.name,
      totalSize: this.totalSize,
      size: this.size,
      entry: this.entry.name,
      files: this.files.map((module) => ({
        name: module.name,
        size: module.size
      })),
      dependencies: this.dependencies
    };
  }

  toHierarchy(): PackageSizeInfo {
    const children: (PackageSizeInfo | FileSizeInfo)[] = [];
    if (this.dependencies) {
      children.push(
        ...this.dependencies.map((dependency) => dependency.toHierarchy())
      );
    }
    children.push(
      ...this.files.map(({ name, size }) => ({
        name: name.replace(`./node_modules/${this.name}/`, ''),
        size
      }))
    );

    return {
      name: this.name,
      totalSize: this.totalSize,
      children
    };
  }
}
