require "au3"
require "pathname"

appdata_path = Pathname.new ENV["LOCALAPPDATA"]
gitter_exe = appdata_path.join("Programs", "Gitter", "Gitter.exe").realpath.to_s

pid = AutoItX3.run(gitter_exe)
p [:pid, pid]

p [:reposition_auth]
AutoItX3::Window.wait("Gitter")
window = AutoItX3::Window.new("Gitter")
window.activate
window.wait_active
window.move(0,0, 1024, 768)

sleep 1

p [:click_login]
AutoItX3.mouse_click(512,450)

p [:github_signin]
AutoItX3::Window.wait("Sign")
window = AutoItX3::Window.new("Sign")
window.activate
window.wait_active
AutoItX3.send_keys "node-gitter{TAB}chatallthethings{ENTER}"

sleep 3

p [:reposition_signedin]
AutoItX3::Window.wait("Gitter")
window = AutoItX3::Window.new("Gitter")
window.activate
window.wait_active
window.move(0,0, 1024, 768)

sleep 1

p [:sign_out]
AutoItX3.mouse_click(30,40) # Gitter menu
AutoItX3.mouse_click(100,200) # Sign out

p [:close_process]
AutoItX3.close_process pid
