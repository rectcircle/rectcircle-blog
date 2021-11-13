---
title: "Intellij 平台插件开发 API"
date: 2021-11-06T19:47:35+08:00
draft: false
toc: true
comments: true
tags:
  - untagged
---

## 相关资源

* [官方文档](https://plugins.jetbrains.com/docs/intellij/basics.html)
* [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples)
* [插件源码搜索浏览](https://plugins.jetbrains.com/intellij-platform-explorer)
* [本文 Demo 库](https://github.com/rectcircle/learn-intellij-platform-plugin)

## 相关术语

### FQN

Fully qualified name, 完全限定名称。在本文语境中，可能是

* 插件中各个贡献点（组件）的 ID
* 类的全名

## 插件运行时分析

### 类加载

> [官方文档](https://plugins.jetbrains.com/docs/intellij/plugin-class-loaders.html)

IntelliJ 平台的 IDE 是通过 Java 编写的，因此其插件是以 Jar 包的被加载到 IDE 的 JVM 中的。

IntelliJ 平台的 IDE 和插件都是运行在同一个 JVM 中的，因此插件与插件、插件和 IDE 是运行在同一个进程中的。为了保证隔离性，对于每个插件创建一个独立的 ClassLoader 并用这个 ClassLoader 来加载这个插件 jar 包的类。这个 ClassLoader 为 `com.intellij.ide.plugins.cl.PluginClassLoader`。

由于该 ClassLoader 类实现了双亲委派机制。所以，针对 Jetbrains API 相关的单例对象来说，对于不同的插件来说就不是隔离的，因此需要小心。（比如 `JBCefApp`）

而，针对其他插件的依赖，因为不同的插件使用不同的类加载器，所以默认情况下是无法查找到类的。因此，需在在 `plugin.xml` 的声明 `<depends>`，这是，本插件的的类加载器就会尝试委托依赖的插件的类加载器来加载依赖的类。

## 本地化

> [官方文档](https://plugins.jetbrains.com/docs/intellij/localization-guide.html)

官方文档没怎么看懂，其他关于本地化的内容：

* [actions 本地化](https://plugins.jetbrains.com/docs/intellij/basic-action-system.html#localizing-actions-and-groups) （[Demo](https://github.com/JetBrains/intellij-sdk-code-samples/tree/6a87dd7dd2106a124deac65ade0f642b240f4b62/action_basics)）
* [配置项](https://plugins.jetbrains.com/docs/intellij/settings-guide.html#settings-declaration-attributes)

## Service 依赖注入

> [官方文档](https://plugins.jetbrains.com/docs/intellij/plugin-services.html)

### 应用粒度

注册

```xml
<!-- 注册一个应用级别的 service （全局实例化一个）-->
<applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.services.MyApplicationService"/>
```

获取

```java
ApplicationManager.getApplication()
          .getService(MyApplicationService.class);
```

### 项目粒度

注册

```xml
        <!-- 注册一个项目级别的 service（每个窗口实例化一个） -->
        <projectService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.services.MyProjectService"/>
```

获取

```java
project.getService(MyProjectService.class); // com.intellij.openapi.project.Project
```

## 版本、平台、插件依赖以及兼容性

> [兼容性](https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html) | [插件依赖](https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html)

### 编译依赖声明

`build.gradle.kts`

```kts
// Configure Gradle IntelliJ Plugin - read more: https://github.com/JetBrains/gradle-intellij-plugin
intellij {
    // ...

    // https://github.com/JetBrains/gradle-intellij-plugin#intellij-platform-properties
    // 平台版本如 IC / IU 等（社区版/专业版）
    type.set(properties("platformType"))
    // 开发编译时使用的平台版如 2021.1.1
    version.set(properties("platformVersion"))

    // ...

    // Plugin Dependencies. Uses `platformPlugins` property from the gradle.properties file.
    // 本插件依赖的插件，如 org.jetbrains.plugins.go:211.6693.111
    plugins.set(properties("platformPlugins").split(',').map(String::trim).filter(String::isNotEmpty))
}
```

### 插件依赖声明

`src/main/resources/META-INF/plugin.xml`

```xml
    <!-- 依赖的内置插件. Read more: https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html -->
    <depends>com.intellij.modules.platform</depends>
    <!-- 可选依赖 （该调试特性仅支持 goland）
        https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html
        https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html
    -->
    <depends optional="true" config-file="demo-golang.xml">org.jetbrains.plugins.go</depends>
```

### 场景：平台特定功能

假设提供一个插件，这个插件有一些功能是全平台都可以使用，某些功能只能在某些特定平台（如 GoLand），中使用。配置方式如下：

第一步，添加编译插件依赖 `gradle.properties`

```properties
platformPlugins = org.jetbrains.plugins.go:211.6693.111
```

第二步，添加声明 `src/main/resources/META-INF/plugin.xml`

```xml
    <!-- 可选依赖 （该调试特性仅支持 goland）
        https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html
        https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html
    -->
    <depends optional="true" config-file="demo-golang.xml">org.jetbrains.plugins.go</depends>
```

第三步，添加特定平台插件配置文件 `src/main/resources/META-INF/demo-golang.xml` ，语法 和 `src/main/resources/META-INF/plugin.xml` 完全一样

## 状态持久化

> [官方文档](https://plugins.jetbrains.com/docs/intellij/persisting-state-of-components.html)

插件开发需要持久化一些状态到磁盘中，以做到重启后状态恢复（如保存设置项）。Intellij 平台提供了 `com.intellij.openapi.components.PersistentStateComponent` 接口， `com.intellij.openapi.components.State` 注解，以及 `com.intellij.openapi.components.Storage` 注解实现该能力。

### 实现 PersistentStateComponent

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/settings/AppSettingsState.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;

import com.intellij.openapi.application.ApplicationManager;
import com.intellij.openapi.components.PersistentStateComponent;
import com.intellij.openapi.components.State;
import com.intellij.openapi.components.Storage;
import com.intellij.util.xmlb.XmlSerializerUtil;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

@State(
        name = "org.intellij.sdk.settings.AppSettingsState", // 该状态存储的唯一标识符，最终会作为 xml 文件的 tags
        // reloadable = false, // default true，如果序列化的文件被外部程序更改了，是否重新加载窗口
        storages = @Storage("SdkSettingsPlugin.xml") // 存储文件名，Project 级别状态，且不需要存储到代码仓库，需使用 StoragePathMacros.WORKSPACE_FILE
)
public class AppSettingsState implements PersistentStateComponent<AppSettingsState> {

    public String userId = "John Q. Public";
    public boolean ideaStatus = false;

    public static AppSettingsState getInstance() {
        return ApplicationManager.getApplication().getService(AppSettingsState.class);
    }

    @Nullable
    @Override
    public AppSettingsState getState() {
        return this;
    }

    @Override
    public void loadState(@NotNull AppSettingsState state) {
        XmlSerializerUtil.copyBean(state, this);
    }

}
```

### PersistentStateComponent 生命周期

* `loadState`
    * 实例化该对象时，且对应位置存在序列化文件时，被调用。
    * 磁盘上文件被修改了，此时开发者需要自己来处理状态变更，如果不处理，可以通过 `reloadable = true` 通过重载来解决。
* `getState` 当用户在设置弹窗点击保存、关闭 IDE、IDE 停用时，被调用。调用是会比较是否和默认值一致，如果一致，则磁盘中不会有文件。否则将写入磁盘中。

### 在 plugin.xml 中注册

应用级别状态（所有窗口共享该状态）

```xml
    <extensions defaultExtensionNs="com.intellij">
        <applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
    </extensions>
```

项目级别状态（每个窗口一个）

```xml
    <extensions defaultExtensionNs="com.intellij">
        <projectService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
    </extensions>
```

### 存储位置

* Application 级别状态，存储在 `~/Library/ApplicationSupport/JetBrains/IntelliJIdea2021.2/options` 路径下
* Project 级别状态，存储在 `~/.idea` 下
    * 如果使用 `StoragePathMacros.WORKSPACE_FILE` 常量。则存储在
        * `path/to/project/project.iws` - for file-based projects
        * `path/to/project/.idea/workspace.xml` - for directory-based ones
    * `StoragePathMacros.WORKSPACE_FILE` 是有特殊的含义，表示该状态，不会同步到代码仓库中，是该用户特化的配置而不是团队共享的，参见 [.idea gitignore 说明](https://intellij-support.jetbrains.com/hc/en-us/articles/206544839-How-to-manage-projects-under-Version-Control-Systems)
    * `StoragePathMacros.WORKSPACE_FILE` 只能在 项目级别使用，如果在 Application 级别使用，将报错

序列化后的一个例子如下：

```xml
<application>
  <component name="org.intellij.sdk.settings.AppSettingsState">
    <option name="ideaStatus" value="true" />
  </component>
</application>
```

### 场景：实现一个通用动态状态存储工具

可以看出，Intellij 插件的状态存储是静态的，需要和类绑定。使用起来有些不方便。因此，想基于该 API，实现动态的状态存储 API。API 设计如下：

```java
enum StatueLevel {
    Global,
    Workspace,
}

interface DynamicState {
    String get(String key, StatueLevel level);
    void update(String key, String value, StatueLevel level);
}
```

实现思路：

* 创建一个类 DynamicStateImpl 实现，PersistentStateComponent，只有一个字段 `Value`， 为序列化后的 JSON。
* 创建两个类继承 GlobalDynamicState、 WorkspaceGlobalDynamicState 继承 `DynamicStateImpl`
    * GlobalDynamicState 添加 `@State` 注解，存储在 `global.xml`
    * WorkspaceGlobalDynamicState 添加 `@State` 注解，存储在 `StoragePathMacros.WORKSPACE_FILE`
* 创建类 DynamicStateService 依赖注入 GlobalDynamicState、 WorkspaceGlobalDynamicState，并实现 DynamicState 接口
* GlobalDynamicState、 WorkspaceGlobalDynamicState、 DynamicStateService 分别注册为 applicationService、projectService、projectService

## 配置项

> [官方文档](https://plugins.jetbrains.com/docs/intellij/settings-tutorial.html) | [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples/tree/main/settings)

配置项在 Intellij 是以 UI 窗口的方式来配置的，因此需要定一个 Swing 组件，存储则使用上文提到的[状态持久化](#状态持久化)。再加上配置项入口类。这就是一个典型的 MVC 模型。

* Model - 状态持久化
* Controller - plugin.xml 配置的入口类
* View - Swing 组件

本例中将创建一个全局配置。

### 入口类 `AppSettingsConfigurable`

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/settings/AppSettingsConfigurable.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;


import com.intellij.openapi.options.Configurable;
import org.jetbrains.annotations.Nls;
import org.jetbrains.annotations.Nullable;

import javax.swing.*;

/**
 * Controller，应用级别配置的实现，必须提供无参数构造函数。
 */
public class AppSettingsConfigurable implements Configurable {
    // 有一些标记接口，如 Configurable.NoScroll、Configurable.NoMargin，用来配置窗口的滚动和边框

    private AppSettingsComponent mySettingsComponent;

    @Nls(capitalization = Nls.Capitalization.Title)
    @Override
    public String getDisplayName() {
        return "SDK: Application Settings Example";
    }

    @Override
    public JComponent getPreferredFocusedComponent() {
        return mySettingsComponent.getPreferredFocusedComponent();
    }

    // 创建一个 Swing 组件，打开设置该设置窗口，该函数会被调用
    @Nullable
    @Override
    public JComponent createComponent() {
        mySettingsComponent = new AppSettingsComponent();
        return mySettingsComponent.getPanel();
    }

    // 用于判断是否 enable apply 按钮
    @Override
    public boolean isModified() {
        AppSettingsState settings = AppSettingsState.getInstance();
        boolean modified = !mySettingsComponent.getUserNameText().equals(settings.userId);
        modified |= mySettingsComponent.getIdeaUserStatus() != settings.ideaStatus;
        return modified;
    }

    // 点击 apply 触发
    @Override
    public void apply() {
        AppSettingsState settings = AppSettingsState.getInstance();
        settings.userId = mySettingsComponent.getUserNameText();
        settings.ideaStatus = mySettingsComponent.getIdeaUserStatus();
    }

    // 在 Configurable.createComponent 后立即被调用，在此处初始化 UI 值
    @Override
    public void reset() {
        AppSettingsState settings = AppSettingsState.getInstance();
        mySettingsComponent.setUserNameText(settings.userId);
        mySettingsComponent.setIdeaUserStatus(settings.ideaStatus);
    }

    // 用户点击 UI 上的确认或者取消，窗口销毁后会调用该函数
    @Override
    public void disposeUIResources() {
        mySettingsComponent = null;
    }
}
```

### 在 plugin.xml 注册入口类

`src/main/resources/META-INF/plugin.xml`

分为两种配置级别，application 级别 和 project 级别。

```xml
        <!-- 属性 applicationConfigurable 和 projectConfigurable 贡献点
            parentId - 定义当前设置项在设置窗口中的位置，可选值为 https://plugins.jetbrains.com/docs/intellij/settings-guide.html#values-for-parent-id-attribute
            Id - 唯一 ID，建议和类名一致
            instance - Configurable 实现类的全名，和 provider 二选一
            provider - ConfigurableProvider 实现类的全名，和 instance 二选一
            nonDefaultProject - projectConfigurable 专属属性，是否允许用户配置默认配置 true - 该配置默认值写死的， false - 该配置默认值用户可以配置
                nonDefaultProject = false 场景例子：编辑器字体，用户可以改变默认的字体，也可以专门为这个项目设置特定的配置
            displayName - 展示名，不需要本地化场景
            key 和 bundle - 需要本地化场景
            groupWeight - 排序顺序，默认为 0 （权重最低）
            dynamic - 设置项内容是否是动态的计算的，默认 false
            childrenEPName - 如果配置项有多页，可以通过该字段组成树形结构？？
        -->
        <!-- 应用级别配置贡献点 -->
        <!-- https://plugins.jetbrains.com/docs/intellij/settings-guide.html#settings-declaration-attributes -->
        <applicationConfigurable parentId="tools"
                                 instance="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsConfigurable"
                                 id="org.intellij.sdk.settings.AppSettingsConfigurable"
                                 displayName="SDK: Application Settings Example"/>
<!--        <projectConfigurable parentId="tools" instance="org.company.ProjectSettingsConfigurable"-->
<!--                             id="org.company.ProjectSettingsConfigurable" displayName="My Project Settings"-->
<!--                             nonDefaultProject="true"/>-->
```

### 状态持久化实现

参见上文[状态持久化](#状态持久化)，注意需注册到 plugin.xml

`src/main/resources/META-INF/plugin.xml`

```xml
        <applicationService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.settings.AppSettingsState"/>
```

### 配置 UI `AppSettingsComponent`

```java
package com.github.rectcircle.learnintellijplatformplugin.settings;

import com.intellij.ui.components.JBCheckBox;
import com.intellij.ui.components.JBLabel;
import com.intellij.ui.components.JBTextField;
import com.intellij.util.ui.FormBuilder;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

/**
 * 封装 Swing 组件
 */
public class AppSettingsComponent {

    private final JPanel myMainPanel;
    private final JBTextField myUserNameText = new JBTextField();
    private final JBCheckBox myIdeaUserStatus = new JBCheckBox("Do you use IntelliJ IDEA? ");

    public AppSettingsComponent() {
        myMainPanel = FormBuilder.createFormBuilder()
                .addLabeledComponent(new JBLabel("Enter user name: "), myUserNameText, 1, false)
                .addComponent(myIdeaUserStatus, 1)
                .addComponentFillVertically(new JPanel(), 0)
                .getPanel();
    }

    public JPanel getPanel() {
        return myMainPanel;
    }

    public JComponent getPreferredFocusedComponent() {
        return myUserNameText;
    }

    @NotNull
    public String getUserNameText() {
        return myUserNameText.getText();
    }

    public void setUserNameText(@NotNull String newText) {
        myUserNameText.setText(newText);
    }

    public boolean getIdeaUserStatus() {
        return myIdeaUserStatus.isSelected();
    }

    public void setIdeaUserStatus(boolean newStatus) {
        myIdeaUserStatus.setSelected(newStatus);
    }

}
```

## UI 组件 - 以工具窗口为例

> [UI 官方文档](https://plugins.jetbrains.com/docs/intellij/user-interface-components.html) | [toolwindow 官方文档](https://plugins.jetbrains.com/docs/intellij/tool-windows.html) | [toolwindow 官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples/tree/main/tool_window) |

intellij 平台插件可以在 IDE 上的各个地方添加定制化的 UI。该小结将介绍工具窗口 （toolwindow）相关能力，设想有如下需求：

在 IDE 里面添加一个侧边栏，点击该侧边栏可以看到日期、时区和时间，以及刷新和隐藏按钮

### 创建 Swing 类和 form 配置

在 `src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow` 右击 `New -> Swing UI Designer -> GUI Form` 输入 Form 名 `MyToolWindow` 并勾选 Create bound class。

通过拖动布置 UI，并编写 `src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyToolWindow.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.toolwindow;

import com.intellij.openapi.wm.ToolWindow;

import javax.swing.*;
import java.util.Calendar;

public class MyToolWindow {

    private JButton refreshToolWindowButton;
    private JButton hideToolWindowButton;
    private JLabel currentDate;
    private JLabel currentTime;
    private JLabel timeZone;
    private JPanel myToolWindowContent;

    public MyToolWindow(ToolWindow toolWindow) {
        // 添加两个按钮的回调函数
        hideToolWindowButton.addActionListener(e -> toolWindow.hide(null));
        refreshToolWindowButton.addActionListener(e -> currentDateTime());

        this.currentDateTime();
    }

    // 刷新 UI 组件状态
    public void currentDateTime() {
        // Get current date and time
        Calendar instance = Calendar.getInstance();
        currentDate.setText(
                instance.get(Calendar.DAY_OF_MONTH) + "/"
                        + (instance.get(Calendar.MONTH) + 1) + "/"
                        + instance.get(Calendar.YEAR)
        );
        currentDate.setIcon(new ImageIcon(getClass().getResource("/toolWindow/Calendar-icon.png")));
        int min = instance.get(Calendar.MINUTE);
        String strMin = min < 10 ? "0" + min : String.valueOf(min);
        currentTime.setText(instance.get(Calendar.HOUR_OF_DAY) + ":" + strMin);
        currentTime.setIcon(new ImageIcon(getClass().getResource("/toolWindow/Time-icon.png")));
        // Get time zone
        long gmt_Offset = instance.get(Calendar.ZONE_OFFSET); // offset from GMT in milliseconds
        String str_gmt_Offset = String.valueOf(gmt_Offset / 3600000);
        str_gmt_Offset = (gmt_Offset > 0) ? "GMT + " + str_gmt_Offset : "GMT - " + str_gmt_Offset;
        timeZone.setText(str_gmt_Offset);
        timeZone.setIcon(new ImageIcon(getClass().getResource("/toolWindow/Time-zone-icon.png")));
    }

    public JPanel getContent() {
        return myToolWindowContent;
    }
}
```

### 编写窗口工厂类

创建 `ToolWindowFactory` 接口的一个实现类，并实现 `createToolWindowContent` 方法，来创建一个 swing 窗口，其他必要有用过的接口为：

* `isApplicable(Project)` 根据项目类型决定是否启用该工具窗口

标记接口

* `com.intellij.openapi.startup.StartupActivity.DumbAware`

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyToolWindowFactory.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.toolwindow;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import org.jetbrains.annotations.NotNull;

public class MyToolWindowFactory implements ToolWindowFactory {

    /**
     * 创建一个 ToolWindows 窗口
     *
     * @param project    当前视图
     * @param toolWindow 当前 tool window
     */
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        MyToolWindow myToolWindow = new MyToolWindow(toolWindow);
        ContentFactory contentFactory = ContentFactory.SERVICE.getInstance();
        Content content = contentFactory.createContent(myToolWindow.getContent(), "", false);
        toolWindow.getContentManager().addContent(content);
    }

}
```

### 在 plugin.xml 中注册

```xml
    <extensions defaultExtensionNs="com.intellij">
        <!-- 注册一个工具窗口按钮，在此配置工具栏按钮的信息，属性说明如下
                id 工具窗口的id - 对应于工具窗口按钮上显示的文本。要提供一个本地化的文本，通过 `toolwindow.stripe.[id]` 方式给出（空格替换为 `_` ），本地化参见 https://plugins.jetbrains.com/docs/intellij/localization-guide.html
                anchor 位置 "left" (default), "right" or "bottom"
                secondary 指定工具窗口是否显示在次要组中（如果 anchor 为 左或右， 该字段为 true 则显示在下方）
                icon 图标使用 13x13 像素，更多参见 https://plugins.jetbrains.com/docs/intellij/work-with-icons-and-images.html
                factoryClass 工厂类
        -->
        <toolWindow id="Sample Calendar"
                    secondary="true"
                    icon="AllIcons.General.Modified"
                    anchor="right"
                    factoryClass="com.github.rectcircle.learnintellijplatformplugin.toolwindow.MyToolWindowFactory"/>
    </extensions>
```

### 通过代码注册窗口

参见 [com.intellij.openapi.wm.ToolWindowManager.registerToolWindow()](https://upsource.jetbrains.com/idea-ce/file/idea-ce-8f0275fd7faaeafdb8900147eab3d256fe4221cb/platform/platform-api/src/com/intellij/openapi/wm/ToolWindowManager.kt?_ga=2.177404709.189575459.1636082800-220348679.1634563234)

### 其他 UI 组件

参见 [官方文档](https://plugins.jetbrains.com/docs/intellij/user-interface-components.html)

## 运行调试

> [官方文档](https://plugins.jetbrains.com/docs/intellij/run-configurations.html) | [官方 Demo](https://github.com/JetBrains/intellij-sdk-code-samples/tree/main/run_configuration)

设想如下场景：

假设某些项目需要运行在特定的环境中，本地没法启动。如果直接使用 Jetbrains 原生提供的远程调试的能力，用户还需要手动编译，将编译产物同步到远端，并运行服务，然后再配置远程调试端口体验极差。此时假设已经有了一个 cli 工具和服务可以做到将编译产物同步到远端运行服务，并返回调试端口，此时希望有一个 Jetrains 插件可以让用户免配置的直接启动。

针对该场景，这个插件的逻辑大概如下：

* 需要有一个自定义运行配置的配置页面，用户填写一些鉴权和远端服务的 ID 等信息
* 用户创建好改调试配置后，点击运行或调试按钮，将调起如下自定义逻辑
    * 前置准备，编译，调用 cli 将编译产物同步到远端运行服务，获取调试端口，并将相关日志打印到 console 中
    * 调用 Jetbrains 原生远程调试能力，连接到远端服务
* 更进一步，甚至可以实现一个管理页面，用户可以免配置的从插件的自定义窗口中的 start 按钮，一键启动调试

简单起见，简化为如下场景：

* 用户配置一个脚本文件
* 执行（以 golang 调试为例）
    * 先弹窗输入输出这个用户配置的内容
    * run 模式
        * 调用 `go run ./`
    * debug 模式
        * 调用 `dlv debug --headless --listen=:2345 --api-version=2 --accept-multiclient ./` 启动进程
        * 检测到 dlv 启动成功后，调用 Jetbrains 原生远程调试能力，连接固定的 `localhost:2345` 调试端口
* 在 UI 组件中，添加一个 debug 按钮，可以唤起调试配置

### 运行配置管理

#### 代码实现

自定义一套运行配置需要分别实现如下接口

* `com.intellij.execution.configurations.ConfigurationType` 运行配置类型：对应 IDE Run Configuration 的模板列表页中每一个顶级项目，负责声明关联的 `ConfigurationFactory` 并作为唯一标识符
* `com.intellij.execution.configurations.ConfigurationFactory` 运行配置工厂：对应 IDE Run Configuration 的模板列表页中每一个子项，负责创建 `RunConfiguration`
* `com.intellij.execution.configurations.RunConfiguration` 运行配置：表示一个运行调试配置实例，会和一个运行配置项编辑器 UI、以及一个运行配置状态存储绑定
* `com.intellij.openapi.options.SettingsEditor` 运行配置项编辑器 UI：一种特殊的 UI，用来编辑展示运行配置项
* `com.intellij.openapi.components.BaseState` 运行配置项存储

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoRunConfigurationType.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.configuration;


import com.intellij.execution.configurations.ConfigurationFactory;
import com.intellij.execution.configurations.ConfigurationType;
import com.intellij.icons.AllIcons;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

// 运行配置类型：对应 IDE Run Configuration 的模板列表页中每一个顶级项目，负责声明关联的 `ConfigurationFactory` 并作为唯一标识符
public class DemoRunConfigurationType implements ConfigurationType {

    // 配置类型 ID
    public static final String ID = "DemoRunConfiguration";

    // 展示名
    @NotNull
    @Override
    public String getDisplayName() {
        return "Demo";
    }

    // 描述
    @Override
    public String getConfigurationTypeDescription() {
        return "Demo run configuration type";
    }

    @Override
    public Icon getIcon() {
        return AllIcons.General.Information;
    }

    @NotNull
    @Override
    public String getId() {
        return ID;
    }

    @Override
    public ConfigurationFactory[] getConfigurationFactories() {
        return new ConfigurationFactory[]{new DemoConfigurationFactory(this)};
    }

}
```

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoConfigurationFactory.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.configuration;


import com.intellij.execution.configurations.ConfigurationFactory;
import com.intellij.execution.configurations.ConfigurationType;
import com.intellij.execution.configurations.RunConfiguration;
import com.intellij.openapi.components.BaseState;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

// 运行配置工厂：对应 IDE Run Configuration 的模板列表页中每一个子项，负责创建 `RunConfiguration`
public class DemoConfigurationFactory extends ConfigurationFactory {

    // ConfigurationType 作为工厂的成员
    protected DemoConfigurationFactory(ConfigurationType type) {
        super(type);
    }

    @Override
    public @NotNull String getId() {
        return DemoRunConfigurationType.ID;
    }

    // 获取到一个模板配置
    @NotNull
    @Override
    public RunConfiguration createTemplateConfiguration(@NotNull Project project) {
        return new DemoRunConfiguration(project, this, "Demo");
    }

    // 声明该配置的选项声明类是什么
    @Nullable
    @Override
    public Class<? extends BaseState> getOptionsClass() {
        return DemoRunConfigurationOptions.class;
    }

}
```

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoRunConfiguration.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.configuration;


import com.intellij.execution.ExecutionException;
import com.intellij.execution.Executor;
import com.intellij.execution.configurations.*;
import com.intellij.execution.process.OSProcessHandler;
import com.intellij.execution.process.ProcessHandler;
import com.intellij.execution.process.ProcessHandlerFactory;
import com.intellij.execution.process.ProcessTerminatedListener;
import com.intellij.execution.runners.ExecutionEnvironment;
import com.intellij.openapi.options.SettingsEditor;
import com.intellij.openapi.project.Project;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;

// 运行配置：表示一个运行调试配置实例，会和一个运行配置项编辑器 UI、以及一个运行配置状态存储绑定
public class DemoRunConfiguration extends RunConfigurationBase<DemoRunConfigurationOptions> {

    protected DemoRunConfiguration(Project project, ConfigurationFactory factory, String name) {
        super(project, factory, name);
    }

    @NotNull
    @Override
    protected DemoRunConfigurationOptions getOptions() {
        return (DemoRunConfigurationOptions) super.getOptions();
    }

    public String getScriptName() {
        return getOptions().getScriptName();
    }

    public void setScriptName(String scriptName) {
        getOptions().setScriptName(scriptName);
    }

    @NotNull
    @Override
    public SettingsEditor<? extends RunConfiguration> getConfigurationEditor() {
        return new DemoSettingsEditor();
    }

    @Override
    public void checkConfiguration() {
    }

    // 核心入口，获取到 RunProfileState 实现
    @Nullable
    @Override
    public RunProfileState getState(@NotNull Executor executor, @NotNull ExecutionEnvironment executionEnvironment) {
        return new CommandLineState(executionEnvironment) {
            @NotNull
            @Override
            protected ProcessHandler startProcess() throws ExecutionException {
                // 先简单的实现为直接通过命令行执行
                GeneralCommandLine commandLine = new GeneralCommandLine(getOptions().getScriptName());
                OSProcessHandler processHandler = ProcessHandlerFactory.getInstance().createColoredProcessHandler(commandLine);
                ProcessTerminatedListener.attach(processHandler);
                return processHandler;
            }
        };
    }
}
```

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoRunConfigurationOptions.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.configuration;

import com.intellij.execution.configurations.RunConfigurationOptions;
import com.intellij.openapi.components.StoredProperty;

// 运行配置项存储
public class DemoRunConfigurationOptions extends RunConfigurationOptions {

    private final StoredProperty<String> myScriptName = string("").provideDelegate(this, "scriptName");

    public String getScriptName() {
        return myScriptName.getValue(this);
    }

    public void setScriptName(String scriptName) {
        myScriptName.setValue(this, scriptName);
    }

}
```

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoSettingsEditor.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.configuration;


import com.intellij.openapi.options.SettingsEditor;
import com.intellij.openapi.ui.LabeledComponent;
import com.intellij.openapi.ui.TextFieldWithBrowseButton;
import org.jetbrains.annotations.NotNull;

import javax.swing.*;

// 运行配置项编辑器 UI：一种特殊的 UI，用来编辑展示运行配置项
public class DemoSettingsEditor extends SettingsEditor<DemoRunConfiguration> {

    private JPanel myPanel;
    private LabeledComponent<TextFieldWithBrowseButton> myScriptName;

    @Override
    protected void resetEditorFrom(DemoRunConfiguration demoRunConfiguration) {
        myScriptName.getComponent().setText(demoRunConfiguration.getScriptName());
    }

    @Override
    protected void applyEditorTo(@NotNull DemoRunConfiguration demoRunConfiguration) {
        demoRunConfiguration.setScriptName(myScriptName.getComponent().getText());
    }

    @NotNull
    @Override
    protected JComponent createEditor() {
        return myPanel;
    }

    private void createUIComponents() {
        myScriptName = new LabeledComponent<>();
        myScriptName.setComponent(new TextFieldWithBrowseButton());
    }

}
```

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/configuration/DemoSettingsEditor.form` swing form 表单略

#### 在 plugin.xml 中注册

```xml
<configurationType implementation="com.github.rectcircle.learnintellijplatformplugin.runconfiguration.DemoRunConfigurationType"/>
```

### 执行过程 ProgramRunner

> [官方文档](https://plugins.jetbrains.com/docs/intellij/run-configuration-execution.html)

#### 添加插件依赖并注册 ProgramRunner

> [官方兼容性说明](https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html) | [官方依赖说明](https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html)

由于这个场景需要调用 Goland 的调试器，所以需要添加依赖 Goland 插件。

第一步，添加构建依赖 `gradle.properties`

```properties
platformVersion = 2021.1.1
platformPlugins = org.jetbrains.plugins.go:211.6693.111
```

第二步，添加插件声明 `src/main/resources/META-INF/plugin.xml`

```xml
    <!-- 可选依赖 （该调试特性仅支持 goland）
        https://plugins.jetbrains.com/docs/intellij/plugin-compatibility.html
        https://plugins.jetbrains.com/docs/intellij/plugin-dependencies.html
    -->
    <depends optional="true" config-file="demo-golang.xml">org.jetbrains.plugins.go</depends>
```

第三步，创建 `src/main/resources/META-INF/demo-golang.xml`，将运行配置类型移动到该文件，并添加 programRunner 贡献点

```xml
<idea-plugin>
    <extensions defaultExtensionNs="com.intellij">
        <!-- 调试运行配置的贡献点 -->
        <configurationType implementation="com.github.rectcircle.learnintellijplatformplugin.run.configuration.DemoRunConfigurationType"/>
        <!-- 运行器贡献点 -->
        <programRunner implementation="com.github.rectcircle.learnintellijplatformplugin.run.execution.DemoProgramRunner" order="first"/>
    </extensions>
</idea-plugin>
```

#### ProgramRunner 实现

* 实现 `ProgramRunner` 接口
    * `canRun` 根据运行类型（Debug、Run） 和 `RunProfile` 类型判断是否由该配置 Runner 运行
    * `execute` 真正的执行函数，逻辑基本上为，`ExecutionManager.startRunProfile`
        * 调用 `RunProfile` 的 `getState` 方法
        * 执行回调函数
            * 自定义的操作
            * 调用 `RunProfileState.execute`，获得 `ExecutionResult`
            * 根据运行模式返回不同的 `RunContentDescriptor`

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/execution/DemoProgramRunner.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.execution;

import com.github.rectcircle.learnintellijplatformplugin.run.configuration.DemoRunConfiguration;
import com.goide.dlv.DlvDebugProcess;
import com.goide.dlv.DlvDisconnectOption;
import com.goide.dlv.DlvRemoteVmConnection;
import com.intellij.execution.ExecutionException;
import com.intellij.execution.ExecutionManager;
import com.intellij.execution.ExecutionResult;
import com.intellij.execution.configurations.RunProfile;
import com.intellij.execution.configurations.RunnerSettings;
import com.intellij.execution.runners.ExecutionEnvironment;
import com.intellij.execution.runners.ProgramRunner;
import com.intellij.execution.runners.RunContentBuilder;
import com.intellij.execution.ui.RunContentDescriptor;
import com.intellij.openapi.fileEditor.FileDocumentManager;
import com.intellij.xdebugger.XDebugProcess;
import com.intellij.xdebugger.XDebugProcessStarter;
import com.intellij.xdebugger.XDebugSession;
import com.intellij.xdebugger.XDebuggerManager;
import org.jetbrains.annotations.NonNls;
import org.jetbrains.annotations.NotNull;

import java.net.InetSocketAddress;

// 一个 Runner：实现运行配置启动后的的行为
public class DemoProgramRunner implements ProgramRunner<RunnerSettings>{
    @Override
    public @NotNull @NonNls String getRunnerId() {
        return "DemoProgramRunner";
    }

    private DlvDebugProcess process;

    // 该此执行是否有该 Runner 负责，同时处理 Debug 和 Run 两种场景
    @Override
    public boolean canRun(@NotNull String executorId, @NotNull RunProfile profile) {
        return (ExecutionUtil.isDebugMode(executorId) || ExecutionUtil.isRunMode(executorId))
                && profile instanceof DemoRunConfiguration;
    }

    @Override
    public void execute(@NotNull ExecutionEnvironment environment) throws ExecutionException {
        // 启动 run 配置，调用 `RunProfile` 的 getState 方法
        ExecutionManager.getInstance(environment.getProject()).startRunProfile(environment, state -> {
            // 先保存所有未保存文件
            FileDocumentManager.getInstance().saveAllDocuments();
            // state 为 DemoRunConfiguration.getState() 返回，即 DemoRunProfileState，调用 RunProfileState.execute
            ExecutionResult executionResult = state.execute(environment.getExecutor(), this);
            if (executionResult == null) {
                return null;
            }
            // 获取到 RunContentDescriptor
            if (ExecutionUtil.isDebugMode(environment)) {
                return this.debugModeRunContentDescriptor(environment, executionResult);
            } else if (ExecutionUtil.isRunMode(environment)) {
                return this.runModeRunContentDescriptor(environment, executionResult);
            }
            throw new ExecutionException("Not support");
        });
    }

    // 给 RunProfileState 用，控制连接到 dlv（因为进程启动了，不一定就可以立即连接了，需要 State 自己决定合适连接）
    public void connectToDlv(String host, int port) {
        process.connect(new InetSocketAddress(host, port));
    }

    private RunContentDescriptor runModeRunContentDescriptor(@NotNull ExecutionEnvironment environment, @NotNull ExecutionResult executionResult) throws ExecutionException {
        // 简单返回一个 RunContentDescriptor
        return new RunContentBuilder(executionResult, environment).showRunContent(environment.getContentToReuse());
    }

    private RunContentDescriptor debugModeRunContentDescriptor(@NotNull ExecutionEnvironment environment, @NotNull ExecutionResult executionResult) throws ExecutionException {
        // Debug 调试器附加到进程中，然后一个 Bugger RunContentDescriptor
        return XDebuggerManager.getInstance(environment.getProject()).startSession(environment, new XDebugProcessStarter() {
            @Override
            @NotNull
            public XDebugProcess start(@NotNull XDebugSession session) throws ExecutionException {
                process = new DlvDebugProcess(
                        session,
                        new DlvRemoteVmConnection(DlvDisconnectOption.DETACH),
                        executionResult,
                        true);
                return process;
            }
        }).getRunContentDescriptor();
    }
}
```

#### RunProfileState 实现

RunProfileState 即某次执行的状态控制，一般负责

* 确定启动的外部命令
* 添加进程状态的监听的回调（包括启动/停止/命令行输出）

一般继承 `CommandLineState` 即可

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/execution/DemoRunProfileState.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run.execution;

import com.github.rectcircle.learnintellijplatformplugin.run.configuration.DemoRunConfiguration;
import com.intellij.execution.ExecutionException;
import com.intellij.execution.configurations.CommandLineState;
import com.intellij.execution.configurations.GeneralCommandLine;
import com.intellij.execution.process.*;
import com.intellij.execution.runners.ExecutionEnvironment;
import com.intellij.execution.ui.ConsoleView;
import com.intellij.execution.ui.ConsoleViewContentType;
import com.intellij.execution.ui.RunContentDescriptor;
import com.intellij.execution.ui.RunContentManager;
import com.intellij.openapi.ui.Messages;
import com.intellij.openapi.util.Key;
import com.intellij.xdebugger.XDebuggerManager;
import org.jetbrains.annotations.NotNull;

public class DemoRunProfileState extends CommandLineState {

    public DemoRunProfileState(ExecutionEnvironment environment) {
        super(environment);
    }

    @Override
    protected @NotNull ProcessHandler startProcess() throws ExecutionException {
        var environment = this.getEnvironment();
        var demoRunConfiguration = (DemoRunConfiguration)  environment.getRunnerAndConfigurationSettings().getConfiguration();

        Messages.showInfoMessage(demoRunConfiguration.getScriptName(), "这是用户的配置");

        // 下面是创建一个外部命令行进程
        GeneralCommandLine commandLine;
        if (ExecutionUtil.isRunMode(environment)) { // Run 模式
            commandLine = new GeneralCommandLine("go", "run", "./");
        } else if (ExecutionUtil.isDebugMode(environment)) { // Debug 模式
            commandLine = new GeneralCommandLine("dlv debug --headless --listen=:2345 --api-version=2 --accept-multiclient ./".split(" "));
        } else {
            throw new ExecutionException("Not support");
        }
        commandLine.setWorkDirectory(environment.getProject().getBasePath());
        OSProcessHandler processHandler = ProcessHandlerFactory.getInstance().createColoredProcessHandler(commandLine);
        ProcessTerminatedListener.attach(processHandler);

        // 添加进程的事件监听
        processHandler.addProcessListener(new ProcessAdapter() {
            private boolean connected = false;

            // 进程终止的回调
            @Override
            public void processTerminated(@NotNull ProcessEvent event) {
                getConsoleView(processHandler).print("进程结束停止了", ConsoleViewContentType.SYSTEM_OUTPUT);
            }

            // 检测到进程有输出时的回调
            @Override
            public void onTextAvailable(@NotNull ProcessEvent event, @NotNull Key outputType) {
                // 检测到关键词后，连接到 dlv
                if (!connected && ExecutionUtil.isDebugMode(environment) && event.getText().contains("API server listening at")) {
                    getConsoleView(processHandler).print("即将连接到 dlv", ConsoleViewContentType.SYSTEM_OUTPUT);
                    ((DemoProgramRunner) environment.getRunner()).connectToDlv("localhost", 2345);
                    connected = true;
                }
            }

        });
        return processHandler;
    }

    // 获取到执行页面的 Console，可以打印一些自定义的内容
    private ConsoleView getConsoleView(ProcessHandler processHandler) {
        var environment = this.getEnvironment();
        var project = environment.getProject();
        if (ExecutionUtil.isDebugMode(environment)) {
            var session = XDebuggerManager.getInstance(project).getCurrentSession();
            if (session != null) {
                return session.getConsoleView();
            }
        }
        RunContentDescriptor contentDescriptor = RunContentManager
                .getInstance(project)
                .findContentDescriptor(environment.getExecutor(), processHandler);
        ConsoleView console = null;
        if (contentDescriptor != null && contentDescriptor.getExecutionConsole() instanceof ConsoleView) {
            console = (ConsoleView) contentDescriptor.getExecutionConsole();
        }
        return console;
    }
}
```

#### 其他工具函数

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/execution/ExecutionUtil.java`

```java
import com.intellij.execution.executors.DefaultDebugExecutor;
import com.intellij.execution.executors.DefaultRunExecutor;
import com.intellij.execution.runners.ExecutionEnvironment;

public class ExecutionUtil {

    public static boolean isDebugMode(String executorId) {
        return DefaultDebugExecutor.EXECUTOR_ID.equals(executorId);
    }

    public static boolean isDebugMode(ExecutionEnvironment environment) {
        return isDebugMode(environment.getExecutor().getId());
    }

    public static boolean isRunMode(String executorId) {
        return DefaultRunExecutor.EXECUTOR_ID.equals(executorId);
    }

    public static boolean isRunMode(ExecutionEnvironment environment) {
        return isRunMode(environment.getExecutor().getId());
    }
}
```

### 通过代码启动调试

在 工具窗口 中添加一个按钮，来快速运行。

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyToolWindow.form` 添加一个 `runButton`

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyToolWindow.java` 添加事件监听（注意修改调用方）

```java
    private final Project project;

    // 构造函数添加一个 project 属性，同步修改 src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyToolWindowFactory.java
    public MyToolWindow(Project project, ToolWindow toolWindow) {
        this.project = project;
        // ...
        runButton.addActionListener(e -> {
            var demoRunService = project.getService(DemoRunService.class);
            if (demoRunService != null) {
                demoRunService.run();
            }
        });
        // ...
    }

    public JPanel getContent() {
        // 只有 Goland 场景才激活该按钮
        if (project.getService(DemoRunService.class) == null) {
            runButton.setEnabled(false);
        }
        return myToolWindowContent;
    }
```

编程启动调试器

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/run/DemoRunService.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.run;

import com.github.rectcircle.learnintellijplatformplugin.run.configuration.DemoRunConfiguration;
import com.github.rectcircle.learnintellijplatformplugin.run.configuration.DemoRunConfigurationType;
import com.intellij.execution.ProgramRunnerUtil;
import com.intellij.execution.RunManager;
import com.intellij.execution.RunnerAndConfigurationSettings;
import com.intellij.execution.executors.DefaultRunExecutor;
import com.intellij.openapi.project.Project;

public class DemoRunService {
    private final Project project;

    public DemoRunService(Project project) {
        this.project = project;
    }

    // 程序调起调试器
    public void run() {
        ProgramRunnerUtil.executeConfiguration(getSettings(), DefaultRunExecutor.getRunExecutorInstance());
    }

    private RunnerAndConfigurationSettings getSettings() {
        var runManager = RunManager.getInstance(project);
        var settingName = "Automatic generated";
        // var settings = runManager.findConfigurationByTypeAndName(new DemoRunConfigurationType(), settingName); // 可选的从已有配置中查找
        var settings = runManager.createConfiguration("Automatic generated", DemoRunConfigurationType.class);
        // runManager.addConfiguration(settings); // 可选的保存下来
        var config = (DemoRunConfiguration) settings.getConfiguration();
        config.setScriptName("test.sh");
        return settings;
    }

}
```

在 `src/main/resources/META-INF/demo-golang.xml` 中注册（只为 Goland 服务）

```xml
        <projectService serviceImplementation="com.github.rectcircle.learnintellijplatformplugin.run.DemoRunService" />
```

## Webview （JCEF）

> [官方文档](https://plugins.jetbrains.com/docs/intellij/jcef.html)

IntelliJ 插件提供了利用 Web 前端技术栈开发插件的的能力，即 JCEF。（类似安卓开发的 Webview，参见 从 [Blink 内核渲染架构演进看浏览器技术发展](https://zhuanlan.zhihu.com/p/28184028) ）

JCEF 即 Java 端的 [CEF](https://bitbucket.org/chromiumembedded/cef/wiki/Home) 框架（CEF 即 Chromium Embedded Framework Chromium 嵌入框），其提供一种可以将 Chromium 嵌入到 Swing 的能力。

### 示例代码

在 Toolwindows 加载一个 Webview

`src/main/java/com/github/rectcircle/learnintellijplatformplugin/toolwindow/MyWebviewFactory.java`

```java
package com.github.rectcircle.learnintellijplatformplugin.toolwindow;

import com.intellij.openapi.project.Project;
import com.intellij.openapi.wm.ToolWindow;
import com.intellij.openapi.wm.ToolWindowFactory;
import com.intellij.ui.content.Content;
import com.intellij.ui.content.ContentFactory;
import com.intellij.ui.jcef.*;
import com.jetbrains.cef.JCefAppConfig;
import org.cef.browser.CefBrowser;
import org.cef.browser.CefFrame;
import org.cef.handler.*;

import org.jetbrains.annotations.NotNull;

import javax.swing.*;
import java.awt.*;

public class MyWebviewFactory implements ToolWindowFactory {

    @Override
    public void createToolWindowContent(@NotNull Project project, @NotNull ToolWindow toolWindow) {
        var panel = new JPanel();
        panel.setLayout(new BorderLayout());
        ContentFactory contentFactory = ContentFactory.SERVICE.getInstance();
        Content content = contentFactory.createContent(panel, "", false);
        toolWindow.getContentManager().addContent(content);

        // API 1 - JBCefApp 判断是否支持
        if (!JBCefApp.isSupported()) {
            var notSupportedLabel = new JLabel();
            notSupportedLabel.setText("Not support webview: see https://plugins.jetbrains.com/docs/intellij/jcef.html#jbcefapp");
            panel.add(notSupportedLabel);
            return;
        }
        // API 2 - 对 JBCefApp 进行配置的单例类，需在 JBCefApp.getInstance() 调用前进行配置（如 new JBCefBrowser()）。
        // 不建议进行配置，因为所有插件共享一个
        System.out.println(this.getClass().getClassLoader().toString());
        System.out.println(JBCefApp.class.getClassLoader().toString());
        JCefAppConfig.getInstance().getCefSettings();
        // API 3 - JBCefBrowser Jetbrains 对 Cef 的封装，包含 JBCefClient 和 CefBrowser
        // 给定 URL 或者 HTML 创建一个浏览器实例
        // API 3.1 - 指定 URL 从网络上加载
//        var jbCefBrowser = new JBCefBrowser("https://rectcircle.cn");
        var jbCefBrowser =  new JBCefBrowser();

        // API 3.2 - 指定 HTML 直接加载（打开开发者工具，刷新后就没了。看实现是，读取一次后就删掉了 JBCefFileSchemeHandlerFactory）
        jbCefBrowser.loadHTML(
                "<!DOCTYPE html><html lang=\"en\"><head><title>Test</title></head><body>拼成的HTML，不是从 URL 加载的</body></html>",
                "https://rectcircle.cn"  // 可选的，最终浏览器访问的是 file:///jbcefbrowser/随机数#url=https://rectcircle.cn 走的文件协议，应该还是有跨域问题
        );
        jbCefBrowser.getJBCefClient().addLoadHandler(new CefLoadHandlerAdapter() { // 解决刷新问题的方案（后果是浏览器上会产生无效的 history），更好的做法是不使用 JBCefApp 来创建 JBCefBrowser，而是使用自建的 CefApp 来创建 CefClient 和 CefBrowser
            @Override
            public void onLoadError(CefBrowser browser, CefFrame frame, ErrorCode errorCode, String errorText, String failedUrl) {
                if (errorCode == ErrorCode.ERR_FILE_NOT_FOUND && failedUrl.startsWith("file:///jbcefbrowser")) {
                    jbCefBrowser.loadHTML(
                            "<!DOCTYPE html><html lang=\"en\"><head><title>Test</title></head><body>拼成的HTML，不是从 URL 加载的 2</body></html>",
                            "https://rectcircle.cn"  // 可选的，最终浏览器访问的是 file:///jbcefbrowser/随机数#url=https://rectcircle.cn 走的文件协议，应该还是有跨域问题
                    );
                }
            }
        }, jbCefBrowser.getCefBrowser());
        panel.add(jbCefBrowser.getComponent(), BorderLayout.CENTER);
        // API 4 - JBCefClient 可以添加一些事件回调，拦截网络请求等
        // API 5 - CefBrowser 动态执行 JS 代码，获取 Dom 等
        jbCefBrowser.getJBCefClient().addLoadHandler(new CefLoadHandlerAdapter() {
            @Override
            public void onLoadEnd(CefBrowser browser, CefFrame frame, int httpStatusCode) {
                // API 5.1 - 动态执行 JS 代码
                browser.executeJavaScript(
                        "setInterval(()=>{console.log(\"Java 调用的\")}, 1000)"
                        , "https://rectcircle.cn/js/main.js" // 假装这个代码是从该 URL 中下载的
                        , 0);
            }
        }, jbCefBrowser.getCefBrowser());
        // API 6 - JBCefJSQuery JS 调用 Java 回调函数
        final JBCefJSQuery myJSQuery = JBCefJSQuery.create((JBCefBrowserBase) jbCefBrowser);
        myJSQuery.addHandler((args) -> {
            System.out.println("JS 调用了 这个函数，参数是：" + args);
            if ("null".equals(args)) {
                return new JBCefJSQuery.Response(null, 1, "不允许 null");
            } else if ("undefined".equals(args)) {
                return new JBCefJSQuery.Response(null); // 这样 JS 侧，会掉 onFailure
            }
            return new JBCefJSQuery.Response("Java 的返回值");
        });
        jbCefBrowser.getJBCefClient().addLoadHandler(new CefLoadHandlerAdapter() {
            @Override
            public void onLoadEnd(CefBrowser browser, CefFrame frame, int httpStatusCode) {
                // 将模块注入到浏览器中执行里面
                /*
                window.JavaPanelBridge = {
                    callJava: function(arg) {
                        window.cefQuery_762768232_1({
                            request: '' + JSON.stringify(arg),
                            onSuccess: response=>console.log('callJava 成功', response),
                            onFailure: (error_code,error_message)=>console.log('callJava 失败', error_code, error_message)
                        });
                    }
                };
                */
                browser.executeJavaScript(
                        "window.JavaPanelBridge = {" +
                                "callJava : function(arg) {" +
                                myJSQuery.inject(
                                        "JSON.stringify(arg)",
                                        "response => console.log('callJava 成功', response)",
                                        "(error_code, error_message) => console.log('callJava 失败', error_code, error_message)"
                                    ) +
                                "}" +
                            "};" +
                            "setInterval(()=>{JavaPanelBridge.callJava(); JavaPanelBridge.callJava(null); JavaPanelBridge.callJava({a:1}); JavaPanelBridge.callJava(\"这是参数\");}, 5000)",
                        "https://rectcircle.cn/js/js-bridge.js", 0);
            }
        }, jbCefBrowser.getCefBrowser());

    }
}
```

注册 `src/main/resources/META-INF/plugin.xml`

```xml
        <toolWindow id="Webview"
                    secondary="true"
                    icon="AllIcons.General.Modified"
                    anchor="right"
                    factoryClass="com.github.rectcircle.learnintellijplatformplugin.toolwindow.MyWebviewFactory"/>
```

运行后，打开该 webview ，右键可以打开开发者工具

### Cef API

> [文章](https://github.com/fanfeilong/cefutil/blob/master/doc/CEF%20General%20Usage-zh-cn.md)

* CefApp - 表示一组共享配置的进程组，提供了进程粒度的一些回调函数，可以理解为同样配置的 Chrome 窗口的集合
* CefClient - 提供访问 Browser 实例的回调接口。一个 CefClient 实现可以在任意数量的 Browser 进程中共享
* CefBrowser 和 CefFrame - 可以给浏览器发送命令和获取浏览器的各种信息，可以理解为 Chrome 浏览器的一个标签页和其顶层 frame（如果包含 iframe 则会有多个 CefFrame）

### JB 封装的 API

#### JBCefApp

对 org.cef.CefApp 进行封装的单例类，包含几个常用的静态方法

* `isSupported` 当前环境是否支持
* `getInstance` 获取 `JBCefApp` （如果不存在将创建） 的实例，配置内容 `JCefAppConfig` 来确认

#### JCefAppConfig

对 JBCefApp 进行配置的单例类，需在 JBCefApp.getInstance() 调用前进行配置（如 new JBCefBrowser()）。

不建议进行配置，因为所有插件共享一个，更多参见上文 《类加载》

#### JBCefBrowser

对 CefBrowserClient 和 CefBrowser 的封装。可以返回一个 swing 组件，直接用在各种 UI 上（如 ToolWindow）。

创建方式有几种

* 不指定 CefBrowserClient 和 CefBrowser ，将通过 JBCefApp 来创建 `public JBCefBrowser()` 和 `public JBCefBrowser(@NotNull String url)`
* 复用已经创建的 JBCefClient 和 CefBrowser `public JBCefBrowser(@NotNull CefBrowser cefBrowser, @NotNull JBCefClient client)` 和 `public JBCefBrowser(@NotNull JBCefClient client, @Nullable String url)`

#### JBCefClient

添加或删除各种事件处理函数。比如，页面加载、生命周期事件等等

#### CefBrowser

Cef 原生浏览器对象，对应一个浏览器页面。可以获取 URL、dom，**执行 JS** 等，利用该特性可以实现 js-bridge 发送事件给浏览器的能力

#### JBCefJSQuery

创建一个 JS 回调处理函数，可以做到在 JS 调用 Java 函数的特点，利用该特性可以实现 js-bridge 调用原生 API 的能力
