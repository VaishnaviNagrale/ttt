local nk = require("nakama")

local TURN_TIMEOUT_SEC = 30
local WIN_SCORE = 200
local LOSS_SCORE = -50
local DRAW_SCORE = 25

local WIN_COMBOS = {
  {0,1,2}, {3,4,5}, {6,7,8},
  {0,3,6}, {1,4,7}, {2,5,8},
  {0,4,8}, {2,4,6}
}

local function check_winner(board)
  for _, combo in ipairs(WIN_COMBOS) do
    local a, b, c = combo[1]+1, combo[2]+1, combo[3]+1
    if board[a] ~= "" and board[a] == board[b] and board[b] == board[c] then
      return board[a], combo
    end
  end
  local filled = 0
  for _, v in ipairs(board) do
    if v ~= "" then filled = filled + 1 end
  end
  if filled == 9 then return "draw", nil end
  return nil, nil
end

local function new_board()
  return {"","","","","","","","",""}
end

local function get_match_state(context, dispatcher, tick, state, messages)
  return state
end

local M = {}

function M.match_init(context, setupstate)
  local gamestate = {
    board = new_board(),
    marks = {},
    turn = nil,
    players = {},
    status = "waiting",
    winner = nil,
    win_combo = nil,
    turn_start_tick = 0,
    timed_mode = setupstate and setupstate.timed or false,
    move_count = 0,
  }
  local label = nk.json_encode({ open = 1, timed = gamestate.timed_mode and 1 or 0 })
  return gamestate, 1, label
end

function M.match_join_attempt(context, dispatcher, tick, state, presence, metadata)
  if state.status == "finished" then
    return state, false, "Match already finished"
  end
  if #state.players >= 2 then
    return state, false, "Match is full"
  end
  return state, true
end

function M.match_join(context, dispatcher, tick, state, presences)
  for _, presence in ipairs(presences) do
    table.insert(state.players, presence.user_id)
    if #state.players == 1 then
      state.marks[presence.user_id] = "X"
    else
      state.marks[presence.user_id] = "O"
    end
    nk.logger_info("Player joined: " .. presence.user_id .. " as " .. state.marks[presence.user_id])
  end

  if #state.players == 2 then
    state.status = "playing"
    state.turn = state.players[1]
    state.turn_start_tick = tick
    local label = nk.json_encode({ open = 0, timed = state.timed_mode and 1 or 0 })
    dispatcher.match_label_update(label)

    local msg = nk.json_encode({
      type = "game_start",
      board = state.board,
      marks = state.marks,
      turn = state.turn,
      timed = state.timed_mode,
      timeout_sec = TURN_TIMEOUT_SEC,
    })
    dispatcher.broadcast_message(1, msg)
  else
    local msg = nk.json_encode({ type = "waiting" })
    dispatcher.broadcast_message(1, msg)
  end

  return state
end

function M.match_leave(context, dispatcher, tick, state, presences)
  for _, presence in ipairs(presences) do
    nk.logger_info("Player left: " .. presence.user_id)
    if state.status == "playing" then
      local winner_id = nil
      for _, pid in ipairs(state.players) do
        if pid ~= presence.user_id then
          winner_id = pid
          break
        end
      end
      state.status = "finished"
      state.winner = winner_id
      local msg = nk.json_encode({
        type = "game_over",
        winner = winner_id,
        reason = "opponent_left",
        board = state.board,
      })
      dispatcher.broadcast_message(1, msg)
      if winner_id then
        M._update_leaderboard(context, winner_id, presence.user_id, "win")
      end
    end
  end
  return state
end

function M.match_loop(context, dispatcher, tick, state, messages)
  for _, msg in ipairs(messages) do
    if state.status ~= "playing" then break end

    local data = nk.json_decode(msg.data)
    local sender = msg.sender.user_id

    if data.type == "move" then
      if sender ~= state.turn then
        local err = nk.json_encode({ type = "error", message = "Not your turn" })
        dispatcher.broadcast_message(2, err, {msg.sender})
        goto continue
      end

      local pos = tonumber(data.position)
      if not pos or pos < 1 or pos > 9 then
        local err = nk.json_encode({ type = "error", message = "Invalid position" })
        dispatcher.broadcast_message(2, err, {msg.sender})
        goto continue
      end

      if state.board[pos] ~= "" then
        local err = nk.json_encode({ type = "error", message = "Cell already taken" })
        dispatcher.broadcast_message(2, err, {msg.sender})
        goto continue
      end

      state.board[pos] = state.marks[sender]
      state.move_count = state.move_count + 1

      local result, combo = check_winner(state.board)
      if result then
        state.status = "finished"
        local winner_id = nil
        local loser_id = nil
        if result ~= "draw" then
          for pid, mark in pairs(state.marks) do
            if mark == result then winner_id = pid
            else loser_id = pid end
          end
        end
        state.winner = winner_id
        state.win_combo = combo

        local msg_out = nk.json_encode({
          type = "game_over",
          board = state.board,
          winner = winner_id,
          win_combo = combo,
          reason = result == "draw" and "draw" or "win",
          marks = state.marks,
        })
        dispatcher.broadcast_message(1, msg_out)

        M._update_leaderboard(context, winner_id, loser_id, result)
      else
        for _, pid in ipairs(state.players) do
          if pid ~= sender then
            state.turn = pid
            break
          end
        end
        state.turn_start_tick = tick

        local msg_out = nk.json_encode({
          type = "board_update",
          board = state.board,
          turn = state.turn,
          last_move = { position = pos, player = sender },
        })
        dispatcher.broadcast_message(1, msg_out)
      end

      ::continue::
    end
  end

  if state.status == "playing" and state.timed_mode then
    local elapsed = (tick - state.turn_start_tick) / 1
    if elapsed >= TURN_TIMEOUT_SEC then
      local forfeit_id = state.turn
      local winner_id = nil
      for _, pid in ipairs(state.players) do
        if pid ~= forfeit_id then winner_id = pid break end
      end
      state.status = "finished"
      state.winner = winner_id

      local msg_out = nk.json_encode({
        type = "game_over",
        board = state.board,
        winner = winner_id,
        reason = "timeout",
        marks = state.marks,
      })
      dispatcher.broadcast_message(1, msg_out)
      M._update_leaderboard(context, winner_id, forfeit_id, "win")
    else
      local remaining = TURN_TIMEOUT_SEC - math.floor(elapsed)
      if tick % 1 == 0 then
        local timer_msg = nk.json_encode({
          type = "timer",
          remaining = remaining,
          turn = state.turn,
        })
        dispatcher.broadcast_message(3, timer_msg)
      end
    end
  end

  return state
end

function M.match_terminate(context, dispatcher, tick, state, grace_seconds)
  local msg = nk.json_encode({ type = "server_shutdown" })
  dispatcher.broadcast_message(1, msg)
  return nil
end

function M.match_signal(context, dispatcher, tick, state, data)
  return state, ""
end

function M._update_leaderboard(context, winner_id, loser_id, result)
  pcall(function()
    if result == "win" and winner_id then
      nk.leaderboard_record_write("global_leaderboard", winner_id, "", WIN_SCORE, 0, {
        wins = 1
      })
    end
    if result == "win" and loser_id then
      nk.leaderboard_record_write("global_leaderboard", loser_id, "", LOSS_SCORE, 0, {
        losses = 1
      })
    end
    if result == "draw" then
      for _, pid in ipairs({winner_id, loser_id}) do
        if pid then
          nk.leaderboard_record_write("global_leaderboard", pid, "", DRAW_SCORE, 0, {
            draws = 1
          })
        end
      end
    end
  end)
end

local function rpc_create_match(context, payload)
  local data = payload and nk.json_decode(payload) or {}
  local timed = data.timed or false
  local match_id = nk.match_create("tictactoe", { timed = timed })
  return nk.json_encode({ match_id = match_id })
end
nk.register_rpc(rpc_create_match, "create_match")

local function rpc_get_leaderboard(context, payload)
  local records, owner_records, next_cursor, prev_cursor = nk.leaderboard_records_list(
    "global_leaderboard", {}, 10, nil, 1
  )
  local result = {}
  for _, r in ipairs(records) do
    table.insert(result, {
      user_id = r.owner_id,
      username = r.username,
      score = r.score,
      num_score = r.num_score,
      metadata = r.metadata,
    })
  end
  return nk.json_encode({ leaderboard = result })
end
nk.register_rpc(rpc_get_leaderboard, "get_leaderboard")

local function init(context, logger, nk, initializer)
  initializer.register_match("tictactoe", {
    match_init = M.match_init,
    match_join_attempt = M.match_join_attempt,
    match_join = M.match_join,
    match_leave = M.match_leave,
    match_loop = M.match_loop,
    match_terminate = M.match_terminate,
    match_signal = M.match_signal,
  })

  pcall(function()
    nk.leaderboard_create("global_leaderboard", false, "desc", "incr", nil, false)
  end)

  logger.info("TicTacToe module loaded")
end

return { init_module = init }
